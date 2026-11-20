// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReturnBook from "./ReturnBook";

const returnBookMock = vi.fn();
vi.mock("@/lib/action/book", () => ({
    returnBook: (...args: unknown[]) => returnBookMock(...args),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
    toast: (...args: unknown[]) => toastMock(...args),
}));

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: refreshMock }),
}));

describe("ReturnBook component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the return button", () => {
        render(<ReturnBook recordId="rec-123" />);
        expect(screen.getByRole("button", { name: /return book/i })).toBeInTheDocument();
    });

    it("submits return with the record id, shows success toast and refreshes", async () => {
        returnBookMock.mockResolvedValue({ success: true });
        const user = userEvent.setup();

        render(<ReturnBook recordId="rec-123" />);
        const button = screen.getByRole("button", { name: /return book/i });

        await user.click(button);

        expect(returnBookMock).toHaveBeenCalledWith({ recordId: "rec-123" });
        await waitFor(() => {
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Success",
                    description: "Book returned successfully",
                })
            );
            expect(refreshMock).toHaveBeenCalled();
        });
    });

    it("displays destructive error toast when return action fails", async () => {
        returnBookMock.mockResolvedValue({
            success: false,
            error: "This book has already been returned",
        });
        const user = userEvent.setup();

        render(<ReturnBook recordId="rec-123" />);
        const button = screen.getByRole("button", { name: /return book/i });

        await user.click(button);

        await waitFor(() => {
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Error returning book",
                    description: "This book has already been returned",
                    variant: "destructive",
                })
            );
        });
    });
});
