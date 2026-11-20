// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("imagekitio-next", () => ({
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock.jpg" />,
}));

const mockCountResult = [{ count: 1 }];
const mockUsersList = [
    {
        id: "user-1",
        fullName: "Nelson Mandela",
        email: "nelson@university.edu",
        universityId: 100200,
        universityCard: "/ids/nelson.jpg",
        status: "PENDING",
        role: "USER",
        createdAt: "2026-11-18T10:00:00.000Z",
    },
];

let queryCount = 0;
vi.mock("@/database/drizzle", () => ({
    db: {
        select: () => {
            const builder: any = {
                from: () => builder,
                where: () => builder,
                limit: () => builder,
                offset: () => builder,
                orderBy: () => builder,
                then: (onfulfilled: any) => {
                    queryCount++;
                    const res = queryCount % 2 === 1 ? mockCountResult : mockUsersList;
                    return Promise.resolve(res).then(onfulfilled);
                },
            };
            return builder;
        },
    },
}));

import AdminUsersPage from "./page";

describe("AdminUsersPage server component", () => {
    beforeEach(() => {
        queryCount = 0;
        vi.clearAllMocks();
    });

    it("renders page title, description, users table, and pagination", async () => {
        const pageUi = await AdminUsersPage({
            searchParams: Promise.resolve({ query: "Nelson", status: "PENDING", page: "1" }),
        });

        render(pageUi);

        expect(screen.getByText("All Users")).toBeInTheDocument();
        expect(
            screen.getByText(/Manage registered library members/i)
        ).toBeInTheDocument();
        expect(screen.getByText("Nelson Mandela")).toBeInTheDocument();
        expect(screen.getByText("nelson@university.edu")).toBeInTheDocument();
    });
});
