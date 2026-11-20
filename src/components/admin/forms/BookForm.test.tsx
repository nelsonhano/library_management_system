// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const routerPushMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: routerPushMock }),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
    toast: (...args: any[]) => toastMock(...args),
}));

const createBookMock = vi.fn();
const updateBookMock = vi.fn();
vi.mock("@/lib/admin/actions/book", () => ({
    createBook: (...args: any[]) => createBookMock(...args),
    updateBook: (...args: any[]) => updateBookMock(...args),
}));

vi.mock("@/components/FileUpload", () => ({
    default: ({ placeholder, value, onFileChange }: any) => (
        <input
            aria-label={placeholder}
            data-testid={`upload-${placeholder}`}
            value={value || ""}
            onChange={(e) => onFileChange(e.target.value)}
        />
    ),
}));

vi.mock("@/components/admin/ColorPicker", () => ({
    default: ({ value, onPickerChange }: any) => (
        <input
            aria-label="Color Picker"
            data-testid="color-picker"
            value={value || ""}
            onChange={(e) => onPickerChange(e.target.value)}
        />
    ),
}));

import BookForm from "./BookForm";

const existingBook = {
    id: "33333333-3333-3333-3333-333333333333",
    title: "Refactoring",
    author: "Martin Fowler",
    genre: "Software Engineering",
    rating: 5,
    totalCopies: 8,
    availableCopies: 6,
    coverUrl: "books/covers/refactoring.jpg",
    coverColor: "#224466",
    description: "Improving the design of existing code.",
    videoUrl: "books/videos/refactoring.mp4",
    summary: "Refactoring principles and catalog of refactorings.",
    createdAt: new Date(),
};

describe("BookForm component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders create mode with empty default values and Add Book button", () => {
        render(<BookForm type="create" />);

        expect(
            screen.getByRole("button", { name: "Add Book to Library" })
        ).toBeInTheDocument();
        const titleInput = screen.getByPlaceholderText("Book title") as HTMLInputElement;
        expect(titleInput.value).toBe("");
    });

    it("prefills existing book data and displays Update Book button in update mode", () => {
        render(<BookForm type="update" book={existingBook as any} />);

        expect(
            screen.getByRole("button", { name: "Update Book" })
        ).toBeInTheDocument();

        const titleInput = screen.getByPlaceholderText("Book title") as HTMLInputElement;
        expect(titleInput.value).toBe("Refactoring");

        const authorInput = screen.getByPlaceholderText("Book author") as HTMLInputElement;
        expect(authorInput.value).toBe("Martin Fowler");

        const genreInput = screen.getByPlaceholderText("Book genre") as HTMLInputElement;
        expect(genreInput.value).toBe("Software Engineering");

        const totalCopiesInput = screen.getByPlaceholderText("Total copies") as HTMLInputElement;
        expect(totalCopiesInput.value).toBe("8");

        const descriptionInput = screen.getByPlaceholderText("Book description") as HTMLTextAreaElement;
        expect(descriptionInput.value).toBe("Improving the design of existing code.");
    });

    it("calls updateBook with book id and values when submitted in update mode", async () => {
        updateBookMock.mockResolvedValueOnce({
            success: true,
            data: existingBook,
        });

        render(<BookForm type="update" book={existingBook as any} />);

        const titleInput = screen.getByPlaceholderText("Book title");
        fireEvent.change(titleInput, { target: { value: "Refactoring 2nd Edition" } });

        const submitButton = screen.getByRole("button", { name: "Update Book" });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(updateBookMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: "33333333-3333-3333-3333-333333333333",
                    title: "Refactoring 2nd Edition",
                    author: "Martin Fowler",
                })
            );
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Success",
                    description: "Book updated successfully",
                })
            );
            expect(routerPushMock).toHaveBeenCalledWith("/admin/books");
        });
    });

    it("displays error toast when updateBook rejects", async () => {
        updateBookMock.mockResolvedValueOnce({
            success: false,
            error: "Total copies cannot be lower than active borrowed copies (5).",
        });

        render(<BookForm type="update" book={existingBook as any} />);

        const submitButton = screen.getByRole("button", { name: "Update Book" });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(updateBookMock).toHaveBeenCalled();
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Error",
                    description:
                        "Total copies cannot be lower than active borrowed copies (5).",
                    variant: "destructive",
                })
            );
            expect(routerPushMock).not.toHaveBeenCalled();
        });
    });
});
