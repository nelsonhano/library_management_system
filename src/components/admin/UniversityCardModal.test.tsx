// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("next/image", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt, onError }: { alt: string; onError?: () => void }) => (
        <img alt={alt} src="/mock-card.jpg" onError={onError} data-testid="ik-card-image" />
    ),
}));

import UniversityCardModal from "./UniversityCardModal";

describe("UniversityCardModal component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the View Card action trigger", () => {
        render(
            <UniversityCardModal
                cardPath="/ids/student-123.jpg"
                studentName="Alex Johnson"
                universityId={12345}
            />,
        );

        expect(screen.getByRole("button", { name: /view card/i })).toBeInTheDocument();
    });

    it("opens dialog modal with student details and image preview when clicked", () => {
        render(
            <UniversityCardModal
                cardPath="/ids/student-123.jpg"
                studentName="Alex Johnson"
                universityId={12345}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /view card/i }));

        expect(screen.getByText("University ID Card")).toBeInTheDocument();
        expect(screen.getByText(/Alex Johnson • Student ID: 12345/i)).toBeInTheDocument();
        expect(screen.getByTestId("ik-card-image")).toBeInTheDocument();
    });

    it("renders fallback UI when cardPath is missing", () => {
        render(
            <UniversityCardModal
                cardPath={null}
                studentName="Morgan Lee"
                universityId={99999}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /view card/i }));

        expect(screen.getByText("ID card image could not be loaded")).toBeInTheDocument();
        expect(screen.getByText(/No image uploaded/i)).toBeInTheDocument();
    });

    it("renders fallback UI when image encounters loading error", () => {
        render(
            <UniversityCardModal
                cardPath="/ids/broken.jpg"
                studentName="Taylor Smith"
                universityId={88888}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /view card/i }));

        const image = screen.getByTestId("ik-card-image");
        fireEvent.error(image);

        expect(screen.getByText("ID card image could not be loaded")).toBeInTheDocument();
    });
});
