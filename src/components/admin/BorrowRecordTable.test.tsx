// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import dayjs from "dayjs";

vi.mock("next/image", () => ({
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

vi.mock("imagekitio-next", () => ({
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock-cover.jpg" />,
}));

const routerRefreshMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: routerRefreshMock }),
}));

vi.mock("@/lib/action/book", () => ({
    returnBook: vi.fn(),
}));

import BorrowRecordTable, { AdminBorrowRecord } from "./BorrowRecordTable";

const mockRecords: AdminBorrowRecord[] = [
    {
        id: "rec-1",
        borrowDate: "2026-11-10T10:00:00.000Z",
        dueDate: dayjs().add(5, "day").format("YYYY-MM-DD"),
        returnDate: null,
        status: "BORROWED",
        createdAt: "2026-11-10T10:00:00.000Z",
        book: {
            id: "b-1",
            title: "Designing Data-Intensive Applications",
            author: "Martin Kleppmann",
            genre: "Computer Science",
            coverUrl: "books/covers/ddia.jpg",
            coverColor: "#223344",
        },
        user: {
            id: "u-1",
            fullName: "Alan Turing",
            email: "alan@university.edu",
            universityId: 191206,
        },
    },
    {
        id: "rec-2",
        borrowDate: "2026-10-01T10:00:00.000Z",
        dueDate: dayjs().subtract(5, "day").format("YYYY-MM-DD"),
        returnDate: null,
        status: "BORROWED",
        createdAt: "2026-10-01T10:00:00.000Z",
        book: {
            id: "b-2",
            title: "Structure and Interpretation of Computer Programs",
            author: "Harold Abelson",
            genre: "Computer Science",
            coverUrl: "books/covers/sicp.jpg",
            coverColor: "#443322",
        },
        user: {
            id: "u-2",
            fullName: "Donald Knuth",
            email: "knuth@university.edu",
            universityId: 193801,
        },
    },
    {
        id: "rec-3",
        borrowDate: "2026-09-01T10:00:00.000Z",
        dueDate: "2026-09-15",
        returnDate: "2026-09-14",
        status: "RETURNED",
        createdAt: "2026-09-01T10:00:00.000Z",
        book: {
            id: "b-3",
            title: "Refactoring",
            author: "Martin Fowler",
            genre: "Software Engineering",
            coverUrl: "books/covers/refactoring.jpg",
            coverColor: "#112233",
        },
        user: {
            id: "u-3",
            fullName: "Barbara Liskov",
            email: "barbara@university.edu",
            universityId: 193911,
        },
    },
];

describe("BorrowRecordTable component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders empty state message when records array is empty", () => {
        render(<BorrowRecordTable records={[]} />);

        expect(screen.getByText("No borrow records found")).toBeInTheDocument();
    });

    it("renders record details with book title, borrower, and status badges", () => {
        render(<BorrowRecordTable records={mockRecords} />);

        expect(
            screen.getByText("Designing Data-Intensive Applications")
        ).toBeInTheDocument();
        expect(screen.getByText("Alan Turing")).toBeInTheDocument();
        expect(screen.getByText("Borrowed")).toBeInTheDocument();

        expect(
            screen.getByText("Structure and Interpretation of Computer Programs")
        ).toBeInTheDocument();
        expect(screen.getByText("Donald Knuth")).toBeInTheDocument();
        expect(screen.getByText("Overdue")).toBeInTheDocument();

        expect(screen.getByText("Refactoring")).toBeInTheDocument();
        expect(screen.getByText("Barbara Liskov")).toBeInTheDocument();
        expect(screen.getByText("Returned")).toBeInTheDocument();
    });

    it("renders receipt button for all records and return button only for active loans", () => {
        render(<BorrowRecordTable records={mockRecords} />);

        const receiptButtons = screen.getAllByRole("button", { name: /receipt/i });
        expect(receiptButtons).toHaveLength(3);

        const returnButtons = screen.getAllByRole("button", { name: "Return" });
        expect(returnButtons).toHaveLength(2);
    });
});
