import { beforeEach, describe, expect, it, vi } from "vitest";

import { dbMock } from "@/test/dbMock";

vi.mock("@/database/drizzle", async () => ({
    db: (await import("@/test/dbMock")).dbMock.db,
}));

const authMock = vi.fn();
vi.mock("../../../../auth", () => ({ auth: () => authMock() }));

import { createBook } from "./book";

const validBook = {
    title: "  Clean Code  ",
    author: "Robert C. Martin",
    genre: "Software",
    rating: 5,
    totalCopies: 12,
    coverUrl: "/books/covers/clean.jpg",
    coverColor: "#123ABC",
    description: "A handbook of agile software craftsmanship.",
    videoUrl: "/books/videos/clean.mp4",
    summary: "Write code that humans can read.",
};

const signInAs = (role: "ADMIN" | "USER") => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    dbMock.queue([{ role }]);
};

describe("createBook", () => {
    beforeEach(() => {
        dbMock.reset();
        authMock.mockReset();
    });

    it("rejects a caller with no session, without querying the database", async () => {
        authMock.mockResolvedValue(null);

        const result = await createBook(validBook);

        expect(result).toEqual({ success: false, message: "Unauthorized" });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("rejects a signed in user who is not an admin", async () => {
        signInAs("USER");

        const result = await createBook(validBook);

        expect(result).toEqual({ success: false, message: "Unauthorized" });
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("rejects a session whose user no longer exists", async () => {
        authMock.mockResolvedValue({ user: { id: "gone" } });
        dbMock.queue([]);

        const result = await createBook(validBook);

        expect(result.message).toBe("Unauthorized");
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("rejects invalid book data from an admin before inserting", async () => {
        signInAs("ADMIN");

        const result = await createBook({ ...validBook, coverColor: "red", rating: 9 });

        expect(result).toEqual({ success: false, message: "Invalid book data" });
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("creates the book for an admin, with all copies available and trimmed text", async () => {
        signInAs("ADMIN");
        const saved = { id: "b1", ...validBook, title: "Clean Code" };
        dbMock.queue([saved]);

        const result = await createBook(validBook);

        expect(result).toEqual({ success: true, data: saved });
        const values = dbMock.arg(dbMock.ops("insert")[0], "values") as Record<string, unknown>;
        expect(values).toMatchObject({
            title: "Clean Code",
            totalCopies: 12,
            availableCopies: 12,
        });
    });

    it("drops fields the form doesn't allow, so a caller can't set availableCopies", async () => {
        signInAs("ADMIN");
        dbMock.queue([{ id: "b1" }]);
        const tampered = { ...validBook, availableCopies: 9999, id: "chosen-id" };

        await createBook(tampered as typeof validBook);

        const values = dbMock.arg(dbMock.ops("insert")[0], "values") as Record<string, unknown>;
        expect(values.availableCopies).toBe(12);
        expect(values).not.toHaveProperty("id");
    });

    it("returns a friendly message when the insert fails", async () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        signInAs("ADMIN");
        dbMock.queue(new Error("duplicate key"));

        const result = await createBook(validBook);

        expect(result).toEqual({
            success: false,
            message: "An error occurred while creating the book",
        });
    });
});
