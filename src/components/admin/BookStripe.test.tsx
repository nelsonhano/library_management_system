// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock-cover.jpg" />,
}));

import BookStripe, { BookStripeProps } from "./BookStripe";

const mockStripe: BookStripeProps = {
    id: "stripe-1",
    bookId: "book-uuid-1",
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Software Engineering",
    coverColor: "#123456",
    coverUrl: "books/covers/clean-code.jpg",
    borrowDate: "2026-11-15T10:00:00.000Z",
    status: "BORROWED",
    borrowerName: "Jordan Rivers",
    borrowerEmail: "jordan@university.edu",
};

describe("BookStripe component", () => {
    it("renders book title, author, and genre", () => {
        render(<BookStripe {...mockStripe} />);

        expect(screen.getByText("Clean Code")).toBeInTheDocument();
        expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
        expect(screen.getByText("Software Engineering")).toBeInTheDocument();
    });

    it("renders borrower name and avatar initials", () => {
        render(<BookStripe {...mockStripe} />);

        expect(screen.getByText("Jordan Rivers")).toBeInTheDocument();
        expect(screen.getByText("JR")).toBeInTheDocument();
    });

    it("renders formatted borrow date", () => {
        render(<BookStripe {...mockStripe} />);

        expect(screen.getByText("Nov 15, 2026")).toBeInTheDocument();
    });

    it("renders amber badge when status is BORROWED", () => {
        render(<BookStripe {...mockStripe} status="BORROWED" />);

        const badge = screen.getByText("Borrowed");
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain("bg-amber-100");
        expect(badge.className).toContain("text-amber-800");
    });

    it("renders emerald badge when status is RETURNED", () => {
        render(<BookStripe {...mockStripe} status="RETURNED" />);

        const badge = screen.getByText("Returned");
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain("bg-emerald-100");
        expect(badge.className).toContain("text-emerald-800");
    });

    it("links book title to the public book route", () => {
        render(<BookStripe {...mockStripe} />);

        const titleLink = screen.getByRole("link", { name: "Clean Code" });
        expect(titleLink).toHaveAttribute("href", "/books/book-uuid-1");
    });
});
