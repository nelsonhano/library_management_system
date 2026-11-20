"use server";

import { users } from "@/database/schema";
import { db } from "@/database/drizzle";
import { and, eq } from "drizzle-orm";
import { auth } from "../../../../auth";
import { changeUserAccountStatusSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export const changeUserAccountStatus = async (params: ChangeUserAccountStatusParams) => {
    const session = await auth();
    const callerId = session?.user?.id;

    if (!callerId) {
        return { success: false, error: "Unauthorized" };
    }

    const [caller] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, callerId))
        .limit(1);

    if (caller?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    const parsed = changeUserAccountStatusSchema.safeParse(params);
    if (!parsed.success) {
        return { success: false, error: "Invalid request parameters" };
    }

    const { userId, status } = parsed.data;

    if (userId === callerId) {
        return { success: false, error: "Cannot modify your own account status" };
    }

    try {
        const updated = await db
            .update(users)
            .set({ status })
            .where(and(eq(users.id, userId), eq(users.role, "USER")))
            .returning({ id: users.id, status: users.status });

        if (!updated.length) {
            return { success: false, error: "User not found or is an administrator" };
        }

        revalidatePath("/admin/account-requests");

        return {
            success: true,
            data: updated[0],
        };
    } catch (error) {
        console.error("Error updating user account status:", error);
        return {
            success: false,
            error: "An error occurred while updating account status",
        };
    }
};
