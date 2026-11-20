// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import AdminError from "./error";

describe("AdminError boundary component", () => {
    it("renders fallback heading and error message", () => {
        const error = new Error("Database connection pool exhausted");
        const resetMock = vi.fn();

        render(<AdminError error={error} reset={resetMock} />);

        expect(
            screen.getByText("Something went wrong loading administrative data")
        ).toBeInTheDocument();
        expect(
            screen.getByText("Database connection pool exhausted")
        ).toBeInTheDocument();
    });

    it("calls reset function when Try Again is clicked", () => {
        const error = new Error("Query timeout");
        const resetMock = vi.fn();

        render(<AdminError error={error} reset={resetMock} />);

        const tryAgainButton = screen.getByRole("button", {
            name: "Try Again",
        });
        fireEvent.click(tryAgainButton);

        expect(resetMock).toHaveBeenCalledTimes(1);
    });
});
