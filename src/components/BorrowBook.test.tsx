// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const borrowBookMock = vi.fn();
vi.mock("@/lib/action/book", () => ({
    borrowBook: (...args: unknown[]) => borrowBookMock(...args),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
    toast: (...args: unknown[]) => toastMock(...args),
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

vi.mock("next/image", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import BorrowBook from "./BorrowBook";

const renderButton = (isEligible: boolean, message = "You are not eligible to borrow this book") =>
    render(
        <BorrowBook
            bookId="book-1"
            userId="user-1"
            borrowingEligibility={{ isEligible, message }}
        />,
    );

const borrowButton = () => screen.getByRole("button", { name: /borrow book/i });

describe("BorrowBook", () => {
    beforeEach(() => {
        borrowBookMock.mockReset();
        toastMock.mockReset();
        pushMock.mockReset();
    });

    it("shows the reason and does not borrow when the user is not eligible", async () => {
        const user = userEvent.setup();
        renderButton(false, "Book is not available to borrow");

        await user.click(borrowButton());

        expect(toastMock).toHaveBeenCalledWith(
            expect.objectContaining({
                description: "Book is not available to borrow",
                variant: "destructive",
            }),
        );
        expect(borrowBookMock).not.toHaveBeenCalled();
    });

    it("borrows by book id only, then confirms and goes to the profile page", async () => {
        const user = userEvent.setup();
        borrowBookMock.mockResolvedValue({ success: true });
        renderButton(true);

        await user.click(borrowButton());

        expect(borrowBookMock).toHaveBeenCalledWith({ bookId: "book-1" });
        expect(toastMock).toHaveBeenCalledWith(
            expect.objectContaining({ description: "Book borrowed successfully" }),
        );
        expect(pushMock).toHaveBeenCalledWith("/my-profile");
    });

    it("shows the server's error message when borrowing fails", async () => {
        const user = userEvent.setup();
        borrowBookMock.mockResolvedValue({
            success: false,
            error: "Book is not available for borrowing",
        });
        renderButton(true);

        await user.click(borrowButton());

        expect(toastMock).toHaveBeenCalledWith(
            expect.objectContaining({
                description: "Book is not available for borrowing",
                variant: "destructive",
            }),
        );
        expect(pushMock).not.toHaveBeenCalled();
    });

    it("shows a generic error when the request itself throws", async () => {
        const user = userEvent.setup();
        borrowBookMock.mockRejectedValue(new Error("network"));
        renderButton(true);

        await user.click(borrowButton());

        expect(toastMock).toHaveBeenCalledWith(
            expect.objectContaining({ variant: "destructive" }),
        );
        expect(borrowButton()).toBeEnabled();
    });

    it("disables the button and says 'Borrowing ...' while the request is in flight", async () => {
        const user = userEvent.setup();
        let finish: (v: unknown) => void = () => {};
        borrowBookMock.mockReturnValue(new Promise((r) => (finish = r)));
        renderButton(true);

        await user.click(borrowButton());

        const busy = await screen.findByRole("button", { name: /borrowing/i });
        expect(busy).toBeDisabled();

        finish({ success: true });
        expect(await screen.findByRole("button", { name: /borrow book/i })).toBeEnabled();
    });

    it("can be reached and pressed with the keyboard", async () => {
        const user = userEvent.setup();
        borrowBookMock.mockResolvedValue({ success: true });
        renderButton(true);

        await user.tab();
        expect(borrowButton()).toHaveFocus();
        await user.keyboard("{Enter}");

        expect(borrowBookMock).toHaveBeenCalledTimes(1);
    });
});
