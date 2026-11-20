// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock-cover.jpg" />,
}));

const mockQueryResults = {
    totalBooks: [{ count: 120 }],
    totalUsers: [{ count: 45 }],
    borrowedBooks: [{ count: 15 }],
    pendingRequests: [{ count: 3 }],
    recentBooks: [
        {
            id: "book-1",
            title: "Clean Architecture",
            author: "Robert C. Martin",
            genre: "Software Engineering",
            coverColor: "#123456",
            coverUrl: "books/covers/arch.jpg",
            createdAt: "2026-11-19T10:00:00.000Z",
        },
    ],
    recentBorrowRecords: [
        {
            id: "record-1",
            bookId: "book-1",
            status: "BORROWED",
            borrowDate: "2026-11-18T10:00:00.000Z",
            createdAt: "2026-11-18T10:00:00.000Z",
            bookTitle: "Clean Architecture",
            bookAuthor: "Robert C. Martin",
            bookGenre: "Software Engineering",
            bookCoverColor: "#123456",
            bookCoverUrl: "books/covers/arch.jpg",
            userName: "Alex Morgan",
            userEmail: "alex@university.edu",
        },
    ],
};

let callIndex = 0;
vi.mock("@/database/drizzle", () => ({
    db: {
        select: () => {
            const builder: any = {
                from: () => builder,
                where: () => builder,
                innerJoin: () => builder,
                orderBy: () => builder,
                limit: () => builder,
                then: (onfulfilled: any) => {
                    const result = getNextResult();
                    return Promise.resolve(result).then(onfulfilled);
                },
            };
            return builder;
        },
    },
}));

function getNextResult() {
    const sequence = [
        mockQueryResults.totalBooks,
        mockQueryResults.totalUsers,
        mockQueryResults.borrowedBooks,
        mockQueryResults.pendingRequests,
        mockQueryResults.recentBooks,
        mockQueryResults.recentBorrowRecords,
    ];
    const res = sequence[callIndex % sequence.length];
    callIndex++;
    return res;
}

import AdminDashboardPage from "./page";

describe("AdminDashboardPage server component", () => {
    beforeEach(() => {
        callIndex = 0;
    });

    it("renders metric cards with real counts and deep links", async () => {
        const Page = await AdminDashboardPage();
        render(Page);

        expect(screen.getByText("Total Books")).toBeInTheDocument();
        expect(screen.getByText("120")).toBeInTheDocument();

        expect(screen.getByText("Total Users")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument();

        expect(screen.getByText("Borrowed Books")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();

        expect(screen.getByText("Account Requests")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("renders recently added books and recent borrow requests feeds", async () => {
        const Page = await AdminDashboardPage();
        render(Page);

        expect(screen.getByText("Recently Added Books")).toBeInTheDocument();
        expect(screen.getByText("Recent Borrow Requests")).toBeInTheDocument();

        expect(
            screen.getAllByText("Clean Architecture").length
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Alex Morgan")).toBeInTheDocument();
        expect(screen.getByText("Borrowed")).toBeInTheDocument();
    });
});
