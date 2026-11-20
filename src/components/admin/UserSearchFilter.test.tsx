// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const routerPushMock = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: routerPushMock }),
}));

import UserSearchFilter from "./UserSearchFilter";

describe("UserSearchFilter component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders search input, status select, and search button", () => {
        render(<UserSearchFilter initialQuery="" initialStatus="ALL" />);

        expect(
            screen.getByPlaceholderText("Search by name, email, or student ID...")
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    });

    it("submits search query and navigates with URL query parameter", () => {
        render(<UserSearchFilter initialQuery="" initialStatus="ALL" />);

        const input = screen.getByPlaceholderText(
            "Search by name, email, or student ID..."
        );
        fireEvent.change(input, { target: { value: "Nelson" } });

        const searchButton = screen.getByRole("button", { name: "Search" });
        fireEvent.click(searchButton);

        expect(routerPushMock).toHaveBeenCalledWith("/admin/users?query=Nelson");
    });

    it("shows clear button when filters are active and clears filters when clicked", () => {
        render(<UserSearchFilter initialQuery="Nelson" initialStatus="APPROVED" />);

        const clearButton = screen.getByRole("button", { name: /clear/i });
        expect(clearButton).toBeInTheDocument();

        fireEvent.click(clearButton);
        expect(routerPushMock).toHaveBeenCalledWith("/admin/users");
    });
});
