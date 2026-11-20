// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock-cover.jpg" />,
}));

import BookTable, { BookTableItem } from "./BookTable";

const mockBooks: BookTableItem[] = [
    {
        id: "11111111-1111-1111-1111-111111111111",
        title: "The Pragmatic Programmer",
        author: "David Thomas, Andrew Hunt",
        genre: "Computer Science",
        rating: 5,
        totalCopies: 10,
        availableCopies: 8,
        description: "From journeyman to master.",
        coverColor: "#123456",
        coverUrl: "books/covers/pragmatic.jpg",
        videoUrl: "books/videos/pragmatic.mp4",
        summary: "Classic software guide.",
        createdAt: "2026-11-01T12:00:00.000Z",
    },
    {
        id: "22222222-2222-2222-2222-222222222222",
        title: "Clean Architecture",
        author: "Robert C. Martin",
        genre: "Software Engineering",
        rating: 4,
        totalCopies: 3,
        availableCopies: 0,
        description: "A craftsman's guide.",
        coverColor: "#654321",
        coverUrl: "books/covers/architecture.jpg",
        videoUrl: "books/videos/architecture.mp4",
        summary: "Architecture principles.",
        createdAt: "2026-11-05T08:30:00.000Z",
    },
];

describe("BookTable component", () => {
    it("renders empty state message when no books are provided", () => {
        render(<BookTable books={[]} />);

        expect(screen.getByText("No books found")).toBeInTheDocument();
        expect(
            screen.getByText(
                /No catalog titles match your search criteria. Try adjusting your query or genre filter./i
            )
        ).toBeInTheDocument();
    });

    it("renders table column headers", () => {
        render(<BookTable books={mockBooks} />);

        expect(screen.getByText("Cover")).toBeInTheDocument();
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Author")).toBeInTheDocument();
        expect(screen.getByText("Genre")).toBeInTheDocument();
        expect(screen.getByText("Stock")).toBeInTheDocument();
        expect(screen.getByText("Date Added")).toBeInTheDocument();
        expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("renders book rows with title, author, and genre", () => {
        render(<BookTable books={mockBooks} />);

        expect(screen.getByText("The Pragmatic Programmer")).toBeInTheDocument();
        expect(
            screen.getByText("David Thomas, Andrew Hunt")
        ).toBeInTheDocument();
        expect(screen.getByText("Computer Science")).toBeInTheDocument();

        expect(screen.getByText("Clean Architecture")).toBeInTheDocument();
        expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
        expect(screen.getByText("Software Engineering")).toBeInTheDocument();
    });

    it("renders formatted creation date", () => {
        render(<BookTable books={mockBooks} />);

        expect(screen.getByText("Nov 01, 2026")).toBeInTheDocument();
        expect(screen.getByText("Nov 05, 2026")).toBeInTheDocument();
    });

    it("renders stock levels and in stock / out of stock badges correctly", () => {
        render(<BookTable books={mockBooks} />);

        expect(screen.getByText("8 / 10")).toBeInTheDocument();
        expect(screen.getByText("In stock")).toBeInTheDocument();

        expect(screen.getByText("0 / 3")).toBeInTheDocument();
        expect(screen.getByText("Out of stock")).toBeInTheDocument();
    });

    it("renders view link pointing to the public book page", () => {
        render(<BookTable books={mockBooks} />);

        const viewLink = screen.getByRole("link", {
            name: "View The Pragmatic Programmer",
        });
        expect(viewLink).toHaveAttribute(
            "href",
            "/books/11111111-1111-1111-1111-111111111111"
        );
    });

    it("renders edit link pointing to the admin book edit route", () => {
        render(<BookTable books={mockBooks} />);

        const editLink = screen.getByRole("link", {
            name: "Edit The Pragmatic Programmer",
        });
        expect(editLink).toHaveAttribute(
            "href",
            "/admin/books/11111111-1111-1111-1111-111111111111/edit"
        );
    });

    it("renders delete action button for each book", () => {
        render(<BookTable books={mockBooks} />);

        expect(
            screen.getByRole("button", { name: "Delete The Pragmatic Programmer" })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Delete Clean Architecture" })
        ).toBeInTheDocument();
    });
});
