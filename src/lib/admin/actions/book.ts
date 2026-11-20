"use server";

import { books, borrowRecords, users } from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "../../../../auth";
import { bookSchema, deleteBookSchema, updateBookSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

const verifyAdmin = async () => {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { isAuthorized: false, error: "Unauthorized" };
    }

    const [user] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (user?.role !== "ADMIN") {
        return { isAuthorized: false, error: "Unauthorized" };
    }

    return { isAuthorized: true, userId };
};

export const createBook = async (params: BookParams) => {
    const authResult = await verifyAdmin();
    if (!authResult.isAuthorized) {
        return { success: false, message: "Unauthorized", error: "Unauthorized" };
    }

    const parsed = bookSchema.safeParse(params);
    if (!parsed.success) {
        return { success: false, message: "Invalid book data", error: "Invalid book data" };
    }

    try {
        const newBook = await db
            .insert(books)
            .values({
                ...parsed.data,
                availableCopies: parsed.data.totalCopies,
            })
            .returning();

        revalidatePath("/admin/books");
        revalidatePath("/library");
        revalidatePath("/");

        return {
            success: true,
            message: "Book created successfully",
            data: JSON.parse(JSON.stringify(newBook[0])),
        };
    } catch (error) {
        console.error("Error creating book:", error);
        return {
            success: false,
            message: "An error occurred while creating the book",
            error: "An error occurred while creating the book",
        };
    }
};

export const updateBook = async (params: UpdateBookParams) => {
    const authResult = await verifyAdmin();
    if (!authResult.isAuthorized) {
        return { success: false, message: "Unauthorized", error: "Unauthorized" };
    }

    const parsed = updateBookSchema.safeParse(params);
    if (!parsed.success) {
        return { success: false, message: "Invalid book data", error: "Invalid book data" };
    }

    const { id, ...values } = parsed.data;

    try {
        const [existingBook] = await db
            .select({ id: books.id })
            .from(books)
            .where(eq(books.id, id))
            .limit(1);

        if (!existingBook) {
            return { success: false, message: "Book not found", error: "Book not found" };
        }

        const [activeLoansRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(borrowRecords)
            .where(and(eq(borrowRecords.bookId, id), eq(borrowRecords.status, "BORROWED")));

        const activeLoans = activeLoansRow?.count || 0;

        if (values.totalCopies < activeLoans) {
            return {
                success: false,
                message: `Total copies cannot be less than active loans count (${activeLoans})`,
                error: `Total copies cannot be less than active loans count (${activeLoans})`,
            };
        }

        const availableCopies = values.totalCopies - activeLoans;

        const [updated] = await db
            .update(books)
            .set({
                ...values,
                availableCopies,
            })
            .where(eq(books.id, id))
            .returning();

        revalidatePath("/admin/books");
        revalidatePath(`/books/${id}`);
        revalidatePath("/library");
        revalidatePath("/");

        return {
            success: true,
            message: "Book updated successfully",
            data: JSON.parse(JSON.stringify(updated)),
        };
    } catch (error) {
        console.error("Error updating book:", error);
        return {
            success: false,
            message: "An error occurred while updating the book",
            error: "An error occurred while updating the book",
        };
    }
};

export const deleteBook = async (params: DeleteBookParams) => {
    const authResult = await verifyAdmin();
    if (!authResult.isAuthorized) {
        return { success: false, message: "Unauthorized", error: "Unauthorized" };
    }

    const parsed = deleteBookSchema.safeParse(params);
    if (!parsed.success) {
        return { success: false, message: "Invalid book identifier", error: "Invalid book identifier" };
    }

    const { bookId } = parsed.data;

    try {
        const [existingBook] = await db
            .select({ id: books.id })
            .from(books)
            .where(eq(books.id, bookId))
            .limit(1);

        if (!existingBook) {
            return { success: false, message: "Book not found", error: "Book not found" };
        }

        const [activeLoansRow] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(borrowRecords)
            .where(and(eq(borrowRecords.bookId, bookId), eq(borrowRecords.status, "BORROWED")));

        const activeLoans = activeLoansRow?.count || 0;

        if (activeLoans > 0) {
            return {
                success: false,
                message: `Cannot delete book: ${activeLoans} active student ${activeLoans === 1 ? "loan" : "loans"} currently borrowed.`,
                error: "Active loans exist",
            };
        }

        await db.transaction(async (tx) => {
            await tx.delete(borrowRecords).where(eq(borrowRecords.bookId, bookId));
            await tx.delete(books).where(eq(books.id, bookId));
        });

        revalidatePath("/admin/books");
        revalidatePath("/library");
        revalidatePath("/");

        return {
            success: true,
            message: "Book deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting book:", error);
        return {
            success: false,
            message: "An error occurred while deleting the book",
            error: "An error occurred while deleting the book",
        };
    }
};
