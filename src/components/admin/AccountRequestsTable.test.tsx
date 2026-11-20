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

const changeUserAccountStatusMock = vi.fn();
vi.mock("@/lib/admin/actions/user", () => ({
    changeUserAccountStatus: (...args: any[]) => changeUserAccountStatusMock(...args),
}));

vi.mock("next/image", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

vi.mock("imagekitio-next", () => ({
    // eslint-disable-next-line @next/next/no-img-element
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock.jpg" />,
}));

import AccountRequestsTable, { AccountRequestUser } from "./AccountRequestsTable";

const mockPendingUser: AccountRequestUser = {
    id: "user-1",
    fullName: "Jordan Rivers",
    email: "jordan@university.edu",
    universityId: 100200,
    universityCard: "/ids/card-1.jpg",
    status: "PENDING",
    createdAt: "2026-11-18T10:00:00.000Z",
};

const mockApprovedUser: AccountRequestUser = {
    id: "user-2",
    fullName: "Sam Taylor",
    email: "sam@university.edu",
    universityId: 300400,
    universityCard: "/ids/card-2.jpg",
    status: "APPROVED",
    createdAt: "2026-11-15T09:00:00.000Z",
};

const mockRejectedUser: AccountRequestUser = {
    id: "user-3",
    fullName: "Casey Novak",
    email: "casey@university.edu",
    universityId: 500600,
    universityCard: "/ids/card-3.jpg",
    status: "REJECTED",
    createdAt: "2026-11-10T08:00:00.000Z",
};

describe("AccountRequestsTable component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders empty state message when requests list is empty", () => {
        render(<AccountRequestsTable requests={[]} currentTab="PENDING" />);

        expect(
            screen.getByText("No pending account requests found"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("All student registration requests have been reviewed."),
        ).toBeInTheDocument();
    });

    it("renders student information and pending action buttons on PENDING tab", () => {
        render(
            <AccountRequestsTable
                requests={[mockPendingUser]}
                currentTab="PENDING"
            />,
        );

        expect(screen.getByText("Jordan Rivers")).toBeInTheDocument();
        expect(screen.getByText("jordan@university.edu")).toBeInTheDocument();
        expect(screen.getByText("100200")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    });

    it("approves pending account and refreshes router", async () => {
        changeUserAccountStatusMock.mockResolvedValue({ success: true });

        render(
            <AccountRequestsTable
                requests={[mockPendingUser]}
                currentTab="PENDING"
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        await waitFor(() => {
            expect(changeUserAccountStatusMock).toHaveBeenCalledWith({
                userId: "user-1",
                status: "APPROVED",
            });
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({ title: "Status updated" }),
            );
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });

    it("rejects pending account and refreshes router", async () => {
        changeUserAccountStatusMock.mockResolvedValue({ success: true });

        render(
            <AccountRequestsTable
                requests={[mockPendingUser]}
                currentTab="PENDING"
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Reject" }));

        await waitFor(() => {
            expect(changeUserAccountStatusMock).toHaveBeenCalledWith({
                userId: "user-1",
                status: "REJECTED",
            });
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });

    it("renders Set Pending and Reject buttons on APPROVED tab", () => {
        render(
            <AccountRequestsTable
                requests={[mockApprovedUser]}
                currentTab="APPROVED"
            />,
        );

        expect(screen.getByText("Sam Taylor")).toBeInTheDocument();
        expect(screen.getByText("Approved")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Set Pending" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    });

    it("renders Approve and Set Pending buttons on REJECTED tab", () => {
        render(
            <AccountRequestsTable
                requests={[mockRejectedUser]}
                currentTab="REJECTED"
            />,
        );

        expect(screen.getByText("Casey Novak")).toBeInTheDocument();
        expect(screen.getByText("Rejected")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Set Pending" })).toBeInTheDocument();
    });

    it("displays destructive toast message when server action returns error", async () => {
        changeUserAccountStatusMock.mockResolvedValue({
            success: false,
            error: "Permission denied",
        });

        render(
            <AccountRequestsTable
                requests={[mockPendingUser]}
                currentTab="PENDING"
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        await waitFor(() => {
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Update failed",
                    description: "Permission denied",
                    variant: "destructive",
                }),
            );
        });
    });
});
