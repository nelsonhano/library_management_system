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
