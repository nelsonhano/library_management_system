// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import BookPagination from "./BookPagination";

describe("BookPagination component", () => {
    it("renders nothing when totalBooks is 0", () => {
        const { container } = render(
            <BookPagination
                currentPage={1}
                totalPages={1}
                totalBooks={0}
                limit={10}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("renders item range and page count on first page with multiple pages", () => {
        render(
            <BookPagination
                currentPage={1}
                totalPages={3}
                totalBooks={25}
                limit={10}
            />
        );

        expect(screen.getByText(/Showing/i)).toBeInTheDocument();
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

        // Previous button should be disabled
        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();

        // Next button should be a link
        const nextLink = screen.getByRole("link", { name: /next/i });
        expect(nextLink).toHaveAttribute("href", "/admin/books?page=2");
    });

    it("preserves search query and genre in pagination links", () => {
        render(
            <BookPagination
                currentPage={1}
                totalPages={4}
                totalBooks={35}
                limit={10}
                query="Code"
                genre="Computer Science"
            />
        );

        const nextLink = screen.getByRole("link", { name: /next/i });
        expect(nextLink).toHaveAttribute(
            "href",
            "/admin/books?page=2&query=Code&genre=Computer+Science"
        );
    });

    it("disables Next button on the last page and enables Previous", () => {
        render(
            <BookPagination
                currentPage={3}
                totalPages={3}
                totalBooks={25}
                limit={10}
            />
        );

        const prevLink = screen.getByRole("link", { name: /previous/i });
        expect(prevLink).toHaveAttribute("href", "/admin/books?page=2");

        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).toBeDisabled();
    });
});
