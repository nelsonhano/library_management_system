import { beforeEach, describe, expect, it, vi } from "vitest";
import { dbMock } from "@/test/dbMock";

vi.mock("@/database/drizzle", async () => ({
    db: (await import("@/test/dbMock")).dbMock.db,
}));

const authMock = vi.fn();
vi.mock("../../../../auth", () => ({ auth: () => authMock() }));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePathMock(path) }));

import { changeUserAccountStatus } from "./user";

const targetUserId = "11111111-1111-4111-8111-111111111111";
const adminCallerId = "99999999-9999-4999-8999-999999999999";

const signInAs = (role: "ADMIN" | "USER") => {
    authMock.mockResolvedValue({ user: { id: adminCallerId } });
    dbMock.queue([{ role }]);
};

describe("changeUserAccountStatus", () => {
    beforeEach(() => {
        dbMock.reset();
        authMock.mockReset();
        revalidatePathMock.mockReset();
    });

    it("rejects an unauthenticated caller without querying the database", async () => {
        authMock.mockResolvedValue(null);

        const result = await changeUserAccountStatus({
            userId: targetUserId,
            status: "APPROVED",
        });

        expect(result).toEqual({ success: false, error: "Unauthorized" });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("rejects a caller who is not an administrator", async () => {
        signInAs("USER");

        const result = await changeUserAccountStatus({
            userId: targetUserId,
            status: "APPROVED",
        });

        expect(result).toEqual({ success: false, error: "Unauthorized" });
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("rejects invalid request parameters via Zod schema", async () => {
        signInAs("ADMIN");

        const result = await changeUserAccountStatus({
            userId: "invalid-uuid",
            status: "INVALID" as any,
        });

        expect(result).toEqual({ success: false, error: "Invalid request parameters" });
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("prevents an administrator from modifying their own account status", async () => {
        signInAs("ADMIN");

        const result = await changeUserAccountStatus({
            userId: adminCallerId,
            status: "REJECTED",
        });

        expect(result).toEqual({
            success: false,
            error: "Cannot modify your own account status",
        });
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("approves a pending student account and revalidates path", async () => {
        signInAs("ADMIN");
        const updatedRow = { id: targetUserId, status: "APPROVED" };
        dbMock.queue([updatedRow]);

        const result = await changeUserAccountStatus({
            userId: targetUserId,
            status: "APPROVED",
        });

        expect(result).toEqual({ success: true, data: updatedRow });
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/account-requests");
    });

    it("rejects a student account and revalidates path", async () => {
        signInAs("ADMIN");
        const updatedRow = { id: targetUserId, status: "REJECTED" };
        dbMock.queue([updatedRow]);

        const result = await changeUserAccountStatus({
            userId: targetUserId,
            status: "REJECTED",
        });

        expect(result).toEqual({ success: true, data: updatedRow });
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/account-requests");
    });

    it("reverses a decision by resetting account back to PENDING", async () => {
        signInAs("ADMIN");
        const updatedRow = { id: targetUserId, status: "PENDING" };
        dbMock.queue([updatedRow]);

        const result = await changeUserAccountStatus({
            userId: targetUserId,
            status: "PENDING",
        });

        expect(result).toEqual({ success: true, data: updatedRow });
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/account-requests");
    });

    it("returns error when target user is not found or is an administrator", async () => {
        signInAs("ADMIN");
        dbMock.queue([]); // 0 rows updated

        const result = await changeUserAccountStatus({
            userId: targetUserId,
            status: "APPROVED",
        });

        expect(result).toEqual({
            success: false,
            error: "User not found or is an administrator",
        });
    });

    it("handles database exceptions gracefully", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        signInAs("ADMIN");
        dbMock.queue(new Error("Database connection dropped"));

        const result = await changeUserAccountStatus({
            userId: targetUserId,
            status: "APPROVED",
        });

        expect(result).toEqual({
            success: false,
            error: "An error occurred while updating account status",
        });
    });
});
