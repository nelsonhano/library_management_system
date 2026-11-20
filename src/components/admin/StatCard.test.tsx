// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import StatCard from "./StatCard";

describe("StatCard component", () => {
    it("renders title and count correctly", () => {
        render(
            <StatCard
                title="Total Books"
                count={142}
                icon="/icons/admin/book.svg"
            />
        );

        expect(screen.getByText("Total Books")).toBeInTheDocument();
        expect(screen.getByText("142")).toBeInTheDocument();
    });

    it("renders the icon image with accessible alt text", () => {
        render(
            <StatCard
                title="Borrowed Books"
                count={28}
                icon="/icons/admin/bookmark.svg"
            />
        );

        const img = screen.getByAltText("Borrowed Books");
        expect(img).toBeInTheDocument();
    });

    it("wraps card in a Link when href is provided", () => {
        render(
            <StatCard
                title="Total Users"
                count={85}
                icon="/icons/admin/users.svg"
                href="/admin/users"
            />
        );

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/admin/users");
        expect(screen.getByText("Total Users")).toBeInTheDocument();
    });

    it("renders zero count properly without falling back to blank", () => {
        render(
            <StatCard
                title="Pending Requests"
                count={0}
                icon="/icons/admin/user.svg"
                href="/admin/account-requests"
            />
        );

        expect(screen.getByText("0")).toBeInTheDocument();
    });
});
