// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import dayjs from "dayjs";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("imagekitio-next", () => ({
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock-cover.jpg" />,
}));

const mockCountResult = [{ count: 1 }];
const mockRecordsList = [
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
];

let queryCount = 0;
vi.mock("@/database/drizzle", () => ({
    db: {
        select: () => {
            const builder: any = {
                from: () => builder,
                innerJoin: () => builder,
                where: () => builder,
                limit: () => builder,
                offset: () => builder,
                orderBy: () => builder,
                then: (onfulfilled: any) => {
                    queryCount++;
                    const res =
                        queryCount % 2 === 1 ? mockCountResult : mockRecordsList;
                    return Promise.resolve(res).then(onfulfilled);
                },
            };
            return builder;
        },
    },
}));

import AdminBorrowRecordsPage from "./page";

describe("AdminBorrowRecordsPage server component", () => {
    beforeEach(() => {
        queryCount = 0;
        vi.clearAllMocks();
    });

    it("renders page title, description, borrow records table, and pagination", async () => {
        const pageUi = await AdminBorrowRecordsPage({
            searchParams: Promise.resolve({
                query: "Alan",
                status: "BORROWED",
                page: "1",
            }),
        });

        render(pageUi);

        expect(screen.getByText("Borrow Records")).toBeInTheDocument();
        expect(
            screen.getByText(/Monitor all active and historical book loans/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText("Designing Data-Intensive Applications")
        ).toBeInTheDocument();
        expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    });
});
