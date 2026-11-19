// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));
vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt, path }: { alt: string; path: string }) => <img alt={alt} src={path} />,
}));

import BookList from "./BookList";

const book = (id: string, title: string): BooksProps => ({
    id,
    title,
    author: "Author",
    genre: "Software",
    rating: 4,
    totalCopies: 3,
    availableCopies: 2,
    description: "A book",
    coverColor: "#123456",
    coverUrl: `/covers/${id}.jpg`,
    videoUrl: `/videos/${id}.mp4`,
    summary: "Summary",
});

describe("BookList", () => {
    it("shows a list with just one book (a user with a single borrowed book)", () => {
        render(<BookList title="Borrowed Books" books={[book("b1", "Clean Code")]} />);

        expect(screen.getByRole("heading", { name: "Borrowed Books" })).toBeInTheDocument();
        expect(screen.getAllByRole("listitem")).toHaveLength(1);
        expect(screen.getByRole("link", { name: /clean code/i })).toHaveAttribute(
            "href",
            "/books/b1",
        );
    });

    it("shows every book it is given, each linking to its page", () => {
        render(
            <BookList
                title="Latest Books"
                books={[book("b1", "Clean Code"), book("b2", "Refactoring")]}
            />,
        );

        expect(screen.getAllByRole("listitem")).toHaveLength(2);
        expect(screen.getByRole("link", { name: /refactoring/i })).toHaveAttribute(
            "href",
            "/books/b2",
        );
    });

    it("renders nothing when there are no books", () => {
        const { container } = render(<BookList title="Borrowed Books" books={[]} />);

        expect(container).toBeEmptyDOMElement();
    });
});
