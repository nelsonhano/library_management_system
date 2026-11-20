// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import dayjs from "dayjs";

vi.mock("next/image", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));
vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt, path }: { alt: string; path: string }) => <img alt={alt} src={path} />,
}));
vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: vi.fn() }),
}));

import BookCard from "./BookCard";

const baseProps: BooksProps = {
    id: "book-1",
    title: "Domain-Driven Design",
    author: "Eric Evans",
    genre: "Software Design",
    rating: 5,
    totalCopies: 10,
    availableCopies: 8,
    description: "Tackling Complexity in the Heart of Software",
    coverColor: "#223344",
    coverUrl: "/covers/ddd.jpg",
    videoUrl: "/videos/ddd.mp4",
    summary: "A book on DDD",
};

describe("BookCard component dynamic loan status", () => {
    it("renders basic book information when not a loaned book", () => {
        render(<BookCard {...baseProps} isLoanedBook={false} />);

        expect(screen.getByText("Domain-Driven Design")).toBeInTheDocument();
        expect(screen.getByText("Software Design")).toBeInTheDocument();
        expect(screen.queryByText(/days left to return/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /download receipt/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /return book/i })).not.toBeInTheDocument();
    });

    it("displays future days remaining when loan is not yet due", () => {
        const futureDate = dayjs().add(5, "day").format("YYYY-MM-DD");
        render(<BookCard {...baseProps} isLoanedBook={true} dueDate={futureDate} borrowRecordId="rec-1" />);

        expect(screen.getByText("5 days left to return")).toBeInTheDocument();
        expect(screen.getByAltText("calendar")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /download receipt/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /return book/i })).toBeInTheDocument();
    });

    it("displays singular day remaining when loan is due tomorrow", () => {
        const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
        render(<BookCard {...baseProps} isLoanedBook={true} dueDate={tomorrow} borrowRecordId="rec-1" />);

        expect(screen.getByText("1 day left to return")).toBeInTheDocument();
    });

    it("displays Due today when loan is due on current calendar day", () => {
        const today = dayjs().format("YYYY-MM-DD");
        render(<BookCard {...baseProps} isLoanedBook={true} dueDate={today} borrowRecordId="rec-1" />);

        const statusElement = screen.getByText("Due today");
        expect(statusElement).toBeInTheDocument();
        expect(statusElement.className).toContain("text-amber-400");
    });

    it("displays overdue warning when loan due date has passed", () => {
        const pastDate = dayjs().subtract(4, "day").format("YYYY-MM-DD");
        render(<BookCard {...baseProps} isLoanedBook={true} dueDate={pastDate} borrowRecordId="rec-1" />);

        const statusElement = screen.getByText("4 days overdue");
        expect(statusElement).toBeInTheDocument();
        expect(statusElement.className).toContain("text-red-400");
        expect(screen.getByAltText("warning")).toBeInTheDocument();
    });
});
