// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination component", () => {
    it("returns null when totalItems is 0", () => {
        const { container } = render(
            <Pagination
                currentPage={1}
                totalPages={1}
                totalItems={0}
                limit={10}
                baseUrl="/admin/users"
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it("renders item range and page count on first page with multiple pages", () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={4}
                totalItems={35}
                limit={10}
                baseUrl="/admin/users"
                itemLabel="users"
            />
        );

        expect(screen.getByText(/Showing/i)).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument();
        expect(screen.getByText("35")).toBeInTheDocument();
        expect(screen.getByText(/users/i)).toBeInTheDocument();
        expect(screen.getByText("Page 1 of 4")).toBeInTheDocument();

        const prevButton = screen.getByRole("button", { name: /previous/i });
        expect(prevButton).toBeDisabled();

        const nextLink = screen.getByRole("link", { name: /next/i });
        expect(nextLink).toHaveAttribute("href", "/admin/users?page=2");
    });

    it("renders correct range and links on subsequent pages preserving search and status", () => {
        render(
            <Pagination
                currentPage={2}
                totalPages={3}
                totalItems={25}
                limit={10}
                baseUrl="/admin/users"
                query="alex"
                status="APPROVED"
            />
        );

        expect(screen.getByText("11")).toBeInTheDocument();
        expect(screen.getByText("20")).toBeInTheDocument();
        expect(screen.getByText("25")).toBeInTheDocument();

        const prevLink = screen.getByRole("link", { name: /previous/i });
        expect(prevLink).toHaveAttribute(
            "href",
            "/admin/users?query=alex&status=APPROVED"
        );

        const nextLink = screen.getByRole("link", { name: /next/i });
        expect(nextLink).toHaveAttribute(
            "href",
            "/admin/users?page=3&query=alex&status=APPROVED"
        );
    });

    it("disables next button on final page", () => {
        render(
            <Pagination
                currentPage={3}
                totalPages={3}
                totalItems={25}
                limit={10}
                baseUrl="/admin/borrow-records"
                itemLabel="records"
            />
        );

        expect(screen.getByText("21")).toBeInTheDocument();
        expect(screen.getAllByText("25")).toHaveLength(2);
        expect(screen.getByText(/records/i)).toBeInTheDocument();

        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).toBeDisabled();

        const prevLink = screen.getByRole("link", { name: /previous/i });
        expect(prevLink).toHaveAttribute("href", "/admin/borrow-records?page=2");
    });
});
