// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import dayjs from "dayjs";

vi.mock("next/image", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import BorrowReceipt from "./BorrowReceipt";

describe("BorrowReceipt component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the download receipt trigger button", () => {
        render(
            <BorrowReceipt
                bookId="b1"
                title="The Pragmatic Programmer"
                author="Andy Hunt"
                genre="Computer Science"
                borrowRecordId="rec-12345678"
                dueDate={dayjs().add(5, "day").format("YYYY-MM-DD")}
                borrowDate={dayjs().subtract(2, "day").format("YYYY-MM-DD")}
                userName="Jane Doe"
                userEmail="jane@university.edu"
                universityId={98765}
            />
        );

        const button = screen.getByRole("button", { name: /download receipt/i });
        expect(button).toBeInTheDocument();
    });

    it("opens dialog modal with receipt details when clicked", () => {
        render(
            <BorrowReceipt
                bookId="b1"
                title="The Pragmatic Programmer"
                author="Andy Hunt"
                genre="Computer Science"
                borrowRecordId="rec-12345678"
                dueDate={dayjs().add(5, "day").format("YYYY-MM-DD")}
                borrowDate={dayjs().subtract(2, "day").format("YYYY-MM-DD")}
                userName="Jane Doe"
                userEmail="jane@university.edu"
                universityId={98765}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /download receipt/i }));

        expect(screen.getByText("Borrowing Receipt")).toBeInTheDocument();
        expect(screen.getByText("The Pragmatic Programmer")).toBeInTheDocument();
        expect(screen.getByText(/by Andy Hunt • Computer Science/i)).toBeInTheDocument();
        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        expect(screen.getByText("jane@university.edu")).toBeInTheDocument();
        expect(screen.getByText("98765")).toBeInTheDocument();
        expect(screen.getByText(/5 days remaining/i)).toBeInTheDocument();
    });

    it("triggers text file download when clicking Download Text Receipt", () => {
        const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
        const revokeObjectURLMock = vi.fn();
        const clickMock = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        global.URL.createObjectURL = createObjectURLMock;
        global.URL.revokeObjectURL = revokeObjectURLMock;

        render(
            <BorrowReceipt
                bookId="b1"
                title="Clean Architecture"
                author="Robert C. Martin"
                genre="Software Architecture"
                borrowRecordId="rec-arch-999"
                dueDate={dayjs().add(3, "day").format("YYYY-MM-DD")}
                borrowDate={dayjs().format("YYYY-MM-DD")}
                userName="Alice Smith"
                userEmail="alice@university.edu"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /download receipt/i }));
        fireEvent.click(screen.getByRole("button", { name: /download text receipt/i }));

        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
        expect(clickMock).toHaveBeenCalledTimes(1);
        expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");

        clickMock.mockRestore();
    });

    it("calls window.print when clicking Print / Save PDF", () => {
        const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

        render(
            <BorrowReceipt
                bookId="b1"
                title="Clean Code"
                author="Robert C. Martin"
                genre="Software Architecture"
                borrowRecordId="rec-111"
            />
        );

        fireEvent.click(screen.getByRole("button", { name: /download receipt/i }));
        fireEvent.click(screen.getByRole("button", { name: /print \/ save pdf/i }));

        expect(printSpy).toHaveBeenCalledTimes(1);
        printSpy.mockRestore();
    });
});
