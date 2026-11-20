// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const routerPushMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: routerPushMock }),
}));

import BookSearchFilter from "./BookSearchFilter";

describe("BookSearchFilter component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders search input, genre select, and search button", () => {
        render(
            <BookSearchFilter
                initialQuery=""
                initialGenre="ALL"
                genres={["Fiction", "Non-Fiction", "Computer Science"]}
            />
        );

        expect(
            screen.getByPlaceholderText("Search by title or author...")
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    });

    it("submits search query and navigates with URL query parameter", () => {
        render(
            <BookSearchFilter
                initialQuery=""
                initialGenre="ALL"
                genres={["Fiction", "Computer Science"]}
            />
        );

        const input = screen.getByPlaceholderText("Search by title or author...");
        fireEvent.change(input, { target: { value: "Pragmatic" } });

        const searchButton = screen.getByRole("button", { name: "Search" });
        fireEvent.click(searchButton);

        expect(routerPushMock).toHaveBeenCalledWith("/admin/books?query=Pragmatic");
    });

    it("shows clear button when filters are active and clears filters when clicked", () => {
        render(
            <BookSearchFilter
                initialQuery="Pragmatic"
                initialGenre="ALL"
                genres={["Fiction", "Computer Science"]}
            />
        );

        const clearButton = screen.getByRole("button", { name: /clear/i });
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(routerPushMock).toHaveBeenCalledWith("/admin/books");
    });
});
