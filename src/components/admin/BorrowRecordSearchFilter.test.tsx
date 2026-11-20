// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const routerPushMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: routerPushMock }),
}));

import BorrowRecordSearchFilter from "./BorrowRecordSearchFilter";

describe("BorrowRecordSearchFilter component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders search input, status select, and search button", () => {
        render(<BorrowRecordSearchFilter initialQuery="" initialStatus="ALL" />);

        expect(
            screen.getByPlaceholderText(
                "Search by book title, author, or borrower..."
            )
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    });

    it("submits search query and navigates with URL query parameter", () => {
        render(<BorrowRecordSearchFilter initialQuery="" initialStatus="ALL" />);

        const input = screen.getByPlaceholderText(
            "Search by book title, author, or borrower..."
        );
        fireEvent.change(input, { target: { value: "Javascript" } });

        const searchButton = screen.getByRole("button", { name: "Search" });
        fireEvent.click(searchButton);

        expect(routerPushMock).toHaveBeenCalledWith(
            "/admin/borrow-records?query=Javascript"
        );
    });

    it("shows clear button when filters are active and clears filters when clicked", () => {
        render(
            <BorrowRecordSearchFilter
                initialQuery="Javascript"
                initialStatus="BORROWED"
            />
        );

        const clearButton = screen.getByRole("button", { name: /clear/i });
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(routerPushMock).toHaveBeenCalledWith("/admin/borrow-records");
    });
});
