"use server";

import { books, users } from "@/database/schema";
import { db } from "@/database/drizzle";
import { eq } from "drizzle-orm";
import { auth } from "../../../../auth";
import { bookSchema } from "@/lib/validation";

export const createBook = async (params: BookParams) => {
    // Server actions are public endpoints: check the caller is an admin here,
    // not only in the admin layout.
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { success: false, message: "Unauthorized" };
    }

    const [user] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (user?.role !== "ADMIN") {
        return { success: false, message: "Unauthorized" };
    }

    const parsed = bookSchema.safeParse(params);

    if (!parsed.success) {
        return { success: false, message: "Invalid book data" };
    }

    try {
        const newBook = await db
            .insert(books)
            .values({
                ...parsed.data,
                availableCopies: parsed.data.totalCopies,
            })
            .returning();

        return {
            success: true,
            data: JSON.parse(JSON.stringify(newBook[0])),
        };
    } catch (error) {
        console.log(error);

        return {
            success: false,
            message: "An error occurred while creating the book",
        };
    }
};
