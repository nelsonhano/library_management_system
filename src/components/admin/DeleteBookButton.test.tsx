// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const routerRefreshMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: routerRefreshMock }),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
    toast: (...args: any[]) => toastMock(...args),
}));

const deleteBookMock = vi.fn();
vi.mock("@/lib/admin/actions/book", () => ({
    deleteBook: (...args: any[]) => deleteBookMock(...args),
}));

import DeleteBookButton from "./DeleteBookButton";

describe("DeleteBookButton component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the delete button trigger with accessible label", () => {
        render(
            <DeleteBookButton
                bookId="00000000-0000-0000-0000-000000000001"
                bookTitle="Clean Code"
            />
        );

        const button = screen.getByRole("button", { name: "Delete Clean Code" });
        expect(button).toBeInTheDocument();
    });

    it("opens the confirmation dialog when clicked", () => {
        render(
            <DeleteBookButton
                bookId="00000000-0000-0000-0000-000000000001"
                bookTitle="Clean Code"
            />
        );

        const trigger = screen.getByRole("button", { name: "Delete Clean Code" });
        fireEvent.click(trigger);

        expect(
            screen.getByRole("heading", { name: "Delete Book" })
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Are you sure you want to delete "Clean Code"?/i)
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Delete Book" })
        ).toBeInTheDocument();
    });

    it("cancels deletion when Cancel button is clicked", () => {
        render(
            <DeleteBookButton
                bookId="00000000-0000-0000-0000-000000000001"
                bookTitle="Clean Code"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Delete Clean Code" }));
        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        fireEvent.click(cancelButton);

        expect(deleteBookMock).not.toHaveBeenCalled();
    });

    it("calls deleteBook and refreshes page on success", async () => {
        deleteBookMock.mockResolvedValueOnce({
            success: true,
            message: "Book deleted successfully",
        });

        render(
            <DeleteBookButton
                bookId="00000000-0000-0000-0000-000000000001"
                bookTitle="Clean Code"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Delete Clean Code" }));
        const confirmButton = screen.getByRole("button", { name: "Delete Book" });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(deleteBookMock).toHaveBeenCalledWith({
                bookId: "00000000-0000-0000-0000-000000000001",
            });
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Success",
                    description: "Book deleted successfully",
                })
            );
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });

    it("shows destructive toast when deletion fails with active loans error", async () => {
        deleteBookMock.mockResolvedValueOnce({
            success: false,
            error: "Cannot delete book while active borrowed records exist.",
        });

        render(
            <DeleteBookButton
                bookId="00000000-0000-0000-0000-000000000001"
                bookTitle="Clean Code"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Delete Clean Code" }));
        const confirmButton = screen.getByRole("button", { name: "Delete Book" });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(deleteBookMock).toHaveBeenCalledWith({
                bookId: "00000000-0000-0000-0000-000000000001",
            });
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Delete failed",
                    description:
                        "Cannot delete book while active borrowed records exist.",
                    variant: "destructive",
                })
            );
            expect(routerRefreshMock).not.toHaveBeenCalled();
        });
    });

    it("shows generic destructive toast on unexpected throw", async () => {
        deleteBookMock.mockRejectedValueOnce(new Error("Network disconnect"));

        render(
            <DeleteBookButton
                bookId="00000000-0000-0000-0000-000000000001"
                bookTitle="Clean Code"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Delete Clean Code" }));
        const confirmButton = screen.getByRole("button", { name: "Delete Book" });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Unexpected error",
                    variant: "destructive",
                })
            );
        });
    });
});
