import { beforeEach, describe, expect, it, vi } from "vitest";

import { dbMock } from "@/test/dbMock";

vi.mock("@/database/drizzle", async () => ({
    db: (await import("@/test/dbMock")).dbMock.db,
}));

const authMock = vi.fn();
vi.mock("../../../../auth", () => ({ auth: () => authMock() }));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePathMock(path) }));

import { createBook, updateBook, deleteBook } from "./book";

const validBookId = "11111111-1111-4111-8111-111111111111";

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
        revalidatePathMock.mockReset();
    });

    it("rejects a caller with no session, without querying the database", async () => {
        authMock.mockResolvedValue(null);

        const result = await createBook(validBook);

        expect(result).toEqual({ success: false, message: "Unauthorized", error: "Unauthorized" });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("rejects a signed in user who is not an admin", async () => {
        signInAs("USER");

        const result = await createBook(validBook);

        expect(result).toEqual({ success: false, message: "Unauthorized", error: "Unauthorized" });
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

        expect(result).toEqual({ success: false, message: "Invalid book data", error: "Invalid book data" });
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("creates the book for an admin, with all copies available and trimmed text", async () => {
        signInAs("ADMIN");
        const saved = { id: validBookId, ...validBook, title: "Clean Code" };
        dbMock.queue([saved]);

        const result = await createBook(validBook);

        expect(result).toEqual({ success: true, message: "Book created successfully", data: saved });
        const values = dbMock.arg(dbMock.ops("insert")[0], "values") as Record<string, unknown>;
        expect(values).toMatchObject({
            title: "Clean Code",
            totalCopies: 12,
            availableCopies: 12,
        });
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/books");
    });

    it("drops fields the form doesn't allow, so a caller can't set availableCopies", async () => {
        signInAs("ADMIN");
        dbMock.queue([{ id: validBookId }]);
        const tampered = { ...validBook, availableCopies: 9999, id: "chosen-id" };

        await createBook(tampered as typeof validBook);

        const values = dbMock.arg(dbMock.ops("insert")[0], "values") as Record<string, unknown>;
        expect(values.availableCopies).toBe(12);
        expect(values).not.toHaveProperty("id");
    });

    it("returns a friendly message when the insert fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        signInAs("ADMIN");
        dbMock.queue(new Error("duplicate key"));

        const result = await createBook(validBook);

        expect(result).toEqual({
            success: false,
            message: "An error occurred while creating the book",
            error: "An error occurred while creating the book",
        });
    });
});

describe("updateBook", () => {
    beforeEach(() => {
        dbMock.reset();
        authMock.mockReset();
        revalidatePathMock.mockReset();
    });

    it("rejects an unauthenticated caller", async () => {
        authMock.mockResolvedValue(null);

        const result = await updateBook({ id: validBookId, ...validBook });

        expect(result).toEqual({ success: false, message: "Unauthorized", error: "Unauthorized" });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("rejects invalid book update data", async () => {
        signInAs("ADMIN");

        const result = await updateBook({ id: "not-a-uuid", ...validBook });

        expect(result).toEqual({ success: false, message: "Invalid book data", error: "Invalid book data" });
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("returns error when the book to update is not found", async () => {
        signInAs("ADMIN");
        dbMock.queue([]); // existing book query returns empty

        const result = await updateBook({ id: validBookId, ...validBook });

        expect(result).toEqual({ success: false, message: "Book not found", error: "Book not found" });
    });

    it("rejects reducing total copies below the active loans count", async () => {
        signInAs("ADMIN");
        dbMock.queue([{ id: validBookId }]); // existing book found
        dbMock.queue([{ count: 5 }]); // 5 active student loans

        const result = await updateBook({ id: validBookId, ...validBook, totalCopies: 3 });

        expect(result.success).toBe(false);
        expect(result.message).toContain("Total copies cannot be less than active loans count (5)");
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("successfully updates book and calculates available copies based on active loans", async () => {
        signInAs("ADMIN");
        dbMock.queue([{ id: validBookId }]); // existing book found
        dbMock.queue([{ count: 2 }]); // 2 active loans
        const updatedBook = { id: validBookId, ...validBook, totalCopies: 10, availableCopies: 8 };
        dbMock.queue([updatedBook]);

        const result = await updateBook({ id: validBookId, ...validBook, totalCopies: 10 });

        expect(result).toEqual({
            success: true,
            message: "Book updated successfully",
            data: updatedBook,
        });

        const values = dbMock.arg(dbMock.ops("update")[0], "set") as Record<string, unknown>;
        expect(values.totalCopies).toBe(10);
        expect(values.availableCopies).toBe(8);
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/books");
        expect(revalidatePathMock).toHaveBeenCalledWith(`/books/${validBookId}`);
    });
});

describe("deleteBook", () => {
    beforeEach(() => {
        dbMock.reset();
        authMock.mockReset();
        revalidatePathMock.mockReset();
    });

    it("rejects an unauthenticated caller", async () => {
        authMock.mockResolvedValue(null);

        const result = await deleteBook({ bookId: validBookId });

        expect(result).toEqual({ success: false, message: "Unauthorized", error: "Unauthorized" });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("rejects an invalid book id", async () => {
        signInAs("ADMIN");

        const result = await deleteBook({ bookId: "bad-id" });

        expect(result).toEqual({
            success: false,
            message: "Invalid book identifier",
            error: "Invalid book identifier",
        });
        expect(dbMock.ops("delete")).toHaveLength(0);
    });

    it("returns error when the book to delete is not found", async () => {
        signInAs("ADMIN");
        dbMock.queue([]); // existing book query returns empty

        const result = await deleteBook({ bookId: validBookId });

        expect(result).toEqual({ success: false, message: "Book not found", error: "Book not found" });
    });

    it("rejects deletion when the book currently has active student loans", async () => {
        signInAs("ADMIN");
        dbMock.queue([{ id: validBookId }]); // existing book found
        dbMock.queue([{ count: 2 }]); // 2 active loans

        const result = await deleteBook({ bookId: validBookId });

        expect(result.success).toBe(false);
        expect(result.message).toContain("Cannot delete book: 2 active student loans currently borrowed.");
        expect(dbMock.ops("delete")).toHaveLength(0);
    });

    it("successfully deletes book and cleans up returned records when 0 active loans", async () => {
        signInAs("ADMIN");
        dbMock.queue([{ id: validBookId }]); // existing book found
        dbMock.queue([{ count: 0 }]); // 0 active loans
        dbMock.queue([]); // delete borrow_records
        dbMock.queue([{ id: validBookId }]); // delete books

        const result = await deleteBook({ bookId: validBookId });

        expect(result).toEqual({
            success: true,
            message: "Book deleted successfully",
        });
        expect(dbMock.ops("delete")).toHaveLength(2);
        expect(revalidatePathMock).toHaveBeenCalledWith("/admin/books");
    });
});
