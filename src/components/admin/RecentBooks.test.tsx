// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock-cover.jpg" />,
}));

import RecentBooks, { RecentBookItem } from "./RecentBooks";

const mockBooks: RecentBookItem[] = [
    {
        id: "book-1",
        title: "The Pragmatic Programmer",
        author: "David Thomas",
        genre: "Computer Science",
        coverColor: "#224466",
        coverUrl: "books/covers/pragmatic.jpg",
        createdAt: "2026-11-18T12:00:00.000Z",
    },
    {
        id: "book-2",
        title: "Refactoring",
        author: "Martin Fowler",
        genre: "Software Engineering",
        coverColor: "#664422",
        coverUrl: "books/covers/refactoring.jpg",
        createdAt: "2026-11-19T08:00:00.000Z",
    },
];

describe("RecentBooks component", () => {
    it("renders section heading, View All button, and Add a New Book banner", () => {
        render(<RecentBooks books={mockBooks} />);

        expect(screen.getByText("Recently Added Books")).toBeInTheDocument();

        const viewAllLink = screen.getByRole("link", { name: "View All" });
        expect(viewAllLink).toHaveAttribute("href", "/admin/books");

        const addBannerLink = screen.getByRole("link", {
            name: /Add a New Book/i,
        });
        expect(addBannerLink).toHaveAttribute("href", "/admin/books/new");
    });

    it("renders recently added book titles, authors, and genres", () => {
        render(<RecentBooks books={mockBooks} />);

        expect(
            screen.getByText("The Pragmatic Programmer")
        ).toBeInTheDocument();
        expect(screen.getByText("David Thomas")).toBeInTheDocument();
        expect(screen.getByText("Computer Science")).toBeInTheDocument();

        expect(screen.getByText("Refactoring")).toBeInTheDocument();
        expect(screen.getByText("Martin Fowler")).toBeInTheDocument();
        expect(screen.getByText("Software Engineering")).toBeInTheDocument();
    });

    it("renders formatted creation date for books", () => {
        render(<RecentBooks books={mockBooks} />);

        expect(screen.getByText("Nov 18, 2026")).toBeInTheDocument();
        expect(screen.getByText("Nov 19, 2026")).toBeInTheDocument();
    });

    it("renders empty state message when no books are passed", () => {
        render(<RecentBooks books={[]} />);

        expect(screen.getByText("No books in catalog yet")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Click the button above to add your first book to the library."
            )
        ).toBeInTheDocument();
    });
});
