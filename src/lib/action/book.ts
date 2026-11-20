"use server";

import { db } from "@/database/drizzle";
import { books, borrowRecords, users } from "@/database/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import dayjs from "dayjs";
import { auth } from "../../../auth";

export const borrowBook = async (params: Pick<BorrowBookParams, "bookId">) => {
    const { bookId } = params;

    // Never trust a userId sent by the browser: take it from the session.
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { success: false, error: "You must be signed in to borrow a book" };
    }

    try {
        const [user] = await db
            .select({ status: users.status })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user || user.status !== "APPROVED") {
            return {
                success: false,
                error: "You are not eligible to borrow this book",
            };
        }

        // Decrement only if a copy is still available, in one statement,
        // so two people borrowing the last copy at once can't both succeed.
        const updated = await db
            .update(books)
            .set({ availableCopies: sql`${books.availableCopies} - 1` })
            .where(and(eq(books.id, bookId), gt(books.availableCopies, 0)))
            .returning({ id: books.id });

        if (!updated.length) {
            return {
                success: false,
                error: "Book is not available for borrowing",
            };
        }

        const dueDate = dayjs().add(7, "day").format("YYYY-MM-DD");

        const record = await db
            .insert(borrowRecords)
            .values({
                userId,
                bookId,
                dueDate,
                status: "BORROWED",
            })
            .returning();

        return {
            success: true,
            data: JSON.parse(JSON.stringify(record[0])),
        };
    } catch (error) {
        console.log(error);

        return {
            success: false,
            error: "An error occurred while borrowing the book",
        };
    }
};

export const returnBook = async (params: ReturnBookParams) => {
    const { recordId } = params;

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { success: false, error: "You must be signed in to return a book" };
    }

    try {
        const [record] = await db
            .select()
            .from(borrowRecords)
            .where(eq(borrowRecords.id, recordId))
            .limit(1);

        if (!record) {
            return { success: false, error: "Borrow record not found" };
        }

        if (record.status === "RETURNED") {
            return { success: false, error: "This book has already been returned" };
        }

        const [caller] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const isAdmin = caller?.role === "ADMIN";
        const isOwner = record.userId === userId;

        if (!isOwner && !isAdmin) {
            return { success: false, error: "Unauthorized to return this book" };
        }

        const today = dayjs().format("YYYY-MM-DD");

        const updatedRecord = await db
            .update(borrowRecords)
            .set({
                status: "RETURNED",
                returnDate: today,
            })
            .where(and(eq(borrowRecords.id, recordId), eq(borrowRecords.status, "BORROWED")))
            .returning();

        if (!updatedRecord.length) {
            return { success: false, error: "This book has already been returned" };
        }

        await db
            .update(books)
            .set({ availableCopies: sql`${books.availableCopies} + 1` })
            .where(eq(books.id, record.bookId));

        return {
            success: true,
            data: JSON.parse(JSON.stringify(updatedRecord[0])),
        };
    } catch (error) {
        console.log(error);

        return {
            success: false,
            error: "An error occurred while returning the book",
        };
    }
};
