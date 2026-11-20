import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

import { dbMock } from "@/test/dbMock";

vi.mock("@/database/drizzle", async () => ({
    db: (await import("@/test/dbMock")).dbMock.db,
}));

const authMock = vi.fn();
vi.mock("../../../auth", () => ({ auth: () => authMock() }));

import { borrowBook, returnBook } from "./book";

const SESSION_USER = "11111111-1111-1111-1111-111111111111";
const BOOK_ID = "22222222-2222-2222-2222-222222222222";
const dialect = new PgDialect();
const toSql = (s: unknown) => dialect.sqlToQuery(s as SQL).sql;

describe("borrowBook", () => {
    beforeEach(() => {
        dbMock.reset();
        authMock.mockResolvedValue({ user: { id: SESSION_USER } });
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-17T10:00:00"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("refuses to borrow when nobody is signed in, without touching the database", async () => {
        authMock.mockResolvedValue(null);

        const result = await borrowBook({ bookId: BOOK_ID });

        expect(result).toEqual({
            success: false,
            error: "You must be signed in to borrow a book",
        });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("refuses a signed in user whose account is still PENDING", async () => {
        dbMock.queue([{ status: "PENDING" }]);

        const result = await borrowBook({ bookId: BOOK_ID });

        expect(result).toEqual({
            success: false,
            error: "You are not eligible to borrow this book",
        });
        expect(dbMock.ops("update")).toHaveLength(0);
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("refuses a session whose user no longer exists in the database", async () => {
        dbMock.queue([]);

        const result = await borrowBook({ bookId: BOOK_ID });

        expect(result.success).toBe(false);
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("reports the book as unavailable when no copy is left, and creates no record", async () => {
        dbMock.queue([{ status: "APPROVED" }], []);

        const result = await borrowBook({ bookId: BOOK_ID });

        expect(result).toEqual({
            success: false,
            error: "Book is not available for borrowing",
        });
        expect(dbMock.ops("insert")).toHaveLength(0);
    });

    it("lets an approved user borrow, due in 7 days, recorded under their session id", async () => {
        const record = { id: "r1", userId: SESSION_USER, bookId: BOOK_ID };
        dbMock.queue([{ status: "APPROVED" }], [{ id: BOOK_ID }], [record]);

        const result = await borrowBook({ bookId: BOOK_ID });

        expect(result).toEqual({ success: true, data: record });
        expect(dbMock.arg(dbMock.ops("insert")[0], "values")).toEqual({
            userId: SESSION_USER,
            bookId: BOOK_ID,
            dueDate: "2026-11-24",
            status: "BORROWED",
        });
    });

    it("ignores a userId sent by the caller and always uses the session user", async () => {
        dbMock.queue([{ status: "APPROVED" }], [{ id: BOOK_ID }], [{}]);
        const forged = { bookId: BOOK_ID, userId: "attacker-chosen-id" };

        await borrowBook(forged as { bookId: string });

        const values = dbMock.arg(dbMock.ops("insert")[0], "values") as {
            userId: string;
        };
        expect(values.userId).toBe(SESSION_USER);
    });

    it("decrements copies in one conditional statement so the last copy can't be taken twice", async () => {
        dbMock.queue([{ status: "APPROVED" }], [{ id: BOOK_ID }], [{}]);

        await borrowBook({ bookId: BOOK_ID });

        const update = dbMock.ops("update")[0];
        const set = dbMock.arg(update, "set") as { availableCopies: unknown };
        expect(toSql(set.availableCopies)).toMatch(/"available_copies" - 1/);
        expect(toSql(dbMock.arg(update, "where"))).toMatch(
            /"available_copies" > \$\d/,
        );
    });

    it("returns a friendly error when the database fails", async () => {
        vi.spyOn(console, "log").mockImplementation(() => {});
        dbMock.queue(new Error("connection lost"));

        const result = await borrowBook({ bookId: BOOK_ID });

        expect(result).toEqual({
            success: false,
            error: "An error occurred while borrowing the book",
        });
    });
});

describe("returnBook", () => {
    const RECORD_ID = "33333333-3333-3333-3333-333333333333";
    const OTHER_USER = "44444444-4444-4444-4444-444444444444";

    beforeEach(() => {
        dbMock.reset();
        authMock.mockResolvedValue({ user: { id: SESSION_USER } });
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-20T10:00:00"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("refuses to return when nobody is signed in, without touching the database", async () => {
        authMock.mockResolvedValue(null);

        const result = await returnBook({ recordId: RECORD_ID });

        expect(result).toEqual({
            success: false,
            error: "You must be signed in to return a book",
        });
        expect(dbMock.calls).toHaveLength(0);
    });

    it("returns error when borrow record is not found", async () => {
        dbMock.queue([]);

        const result = await returnBook({ recordId: RECORD_ID });

        expect(result).toEqual({
            success: false,
            error: "Borrow record not found",
        });
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("refuses to return when record is already RETURNED", async () => {
        dbMock.queue([{ id: RECORD_ID, status: "RETURNED", userId: SESSION_USER }]);

        const result = await returnBook({ recordId: RECORD_ID });

        expect(result).toEqual({
            success: false,
            error: "This book has already been returned",
        });
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("refuses when non-admin student attempts to return someone else's book", async () => {
        dbMock.queue(
            [{ id: RECORD_ID, status: "BORROWED", userId: OTHER_USER, bookId: BOOK_ID }],
            [{ role: "USER" }]
        );

        const result = await returnBook({ recordId: RECORD_ID });

        expect(result).toEqual({
            success: false,
            error: "Unauthorized to return this book",
        });
        expect(dbMock.ops("update")).toHaveLength(0);
    });

    it("allows a student to return their own book and increments available copies", async () => {
        const updatedRecord = {
            id: RECORD_ID,
            status: "RETURNED",
            returnDate: "2026-11-20",
            userId: SESSION_USER,
            bookId: BOOK_ID,
        };

        dbMock.queue(
            [{ id: RECORD_ID, status: "BORROWED", userId: SESSION_USER, bookId: BOOK_ID }],
            [{ role: "USER" }],
            [updatedRecord],
            [{ id: BOOK_ID }]
        );

        const result = await returnBook({ recordId: RECORD_ID });

        expect(result).toEqual({ success: true, data: updatedRecord });

        const recordUpdate = dbMock.ops("update")[0];
        expect(dbMock.arg(recordUpdate, "set")).toEqual({
            status: "RETURNED",
            returnDate: "2026-11-20",
        });

        const bookUpdate = dbMock.ops("update")[1];
        const set = dbMock.arg(bookUpdate, "set") as { availableCopies: unknown };
        expect(toSql(set.availableCopies)).toMatch(/"available_copies" \+ 1/);
    });

    it("allows an admin to return any student's book", async () => {
        const updatedRecord = {
            id: RECORD_ID,
            status: "RETURNED",
            returnDate: "2026-11-20",
            userId: OTHER_USER,
            bookId: BOOK_ID,
        };

        dbMock.queue(
            [{ id: RECORD_ID, status: "BORROWED", userId: OTHER_USER, bookId: BOOK_ID }],
            [{ role: "ADMIN" }],
            [updatedRecord],
            [{ id: BOOK_ID }]
        );

        const result = await returnBook({ recordId: RECORD_ID });

        expect(result).toEqual({ success: true, data: updatedRecord });
    });
});
