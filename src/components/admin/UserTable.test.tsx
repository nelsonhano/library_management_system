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
    default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

vi.mock("imagekitio-next", () => ({
    IKImage: ({ alt }: { alt: string }) => <img alt={alt} src="/mock.jpg" />,
}));

import UserTable, { AdminUserRecord } from "./UserTable";

const mockUsers: AdminUserRecord[] = [
    {
        id: "user-1",
        fullName: "Nelson Mandela",
        email: "nelson@university.edu",
        universityId: 100200,
        universityCard: "/ids/nelson.jpg",
        status: "PENDING",
        role: "USER",
        createdAt: "2026-11-18T10:00:00.000Z",
    },
    {
        id: "user-2",
        fullName: "Ada Lovelace",
        email: "ada@university.edu",
        universityId: 300400,
        universityCard: "/ids/ada.jpg",
        status: "APPROVED",
        role: "USER",
        createdAt: "2026-11-15T09:00:00.000Z",
    },
    {
        id: "user-3",
        fullName: "Grace Hopper",
        email: "grace@university.edu",
        universityId: 500600,
        universityCard: "/ids/grace.jpg",
        status: "APPROVED",
        role: "ADMIN",
        createdAt: "2026-11-10T08:00:00.000Z",
    },
];

describe("UserTable component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders empty state message when users array is empty", () => {
        render(<UserTable users={[]} />);

        expect(screen.getByText("No users found")).toBeInTheDocument();
    });

    it("renders user rows with details, role badge, and status badge", () => {
        render(<UserTable users={mockUsers} />);

        expect(screen.getByText("Nelson Mandela")).toBeInTheDocument();
        expect(screen.getByText("nelson@university.edu")).toBeInTheDocument();
        expect(screen.getByText("100200")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();

        expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
        expect(screen.getByText("ada@university.edu")).toBeInTheDocument();

        expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
        expect(screen.getByText("Admin Account")).toBeInTheDocument();
    });

    it("approves pending account and refreshes router", async () => {
        changeUserAccountStatusMock.mockResolvedValueOnce({ success: true });

        render(<UserTable users={[mockUsers[0]]} />);

        const approveButton = screen.getByRole("button", { name: "Approve" });
        fireEvent.click(approveButton);

        await waitFor(() => {
            expect(changeUserAccountStatusMock).toHaveBeenCalledWith({
                userId: "user-1",
                status: "APPROVED",
            });
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Status updated",
                })
            );
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });

    it("rejects approved account and refreshes router", async () => {
        changeUserAccountStatusMock.mockResolvedValueOnce({ success: true });

        render(<UserTable users={[mockUsers[1]]} />);

        const rejectButton = screen.getByRole("button", { name: "Reject" });
        fireEvent.click(rejectButton);

        await waitFor(() => {
            expect(changeUserAccountStatusMock).toHaveBeenCalledWith({
                userId: "user-2",
                status: "REJECTED",
            });
            expect(routerRefreshMock).toHaveBeenCalled();
        });
    });

    it("displays error toast when status update fails", async () => {
        changeUserAccountStatusMock.mockResolvedValueOnce({
            success: false,
            error: "Database error",
        });

        render(<UserTable users={[mockUsers[0]]} />);

        const approveButton = screen.getByRole("button", { name: "Approve" });
        fireEvent.click(approveButton);

        await waitFor(() => {
            expect(toastMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Update failed",
                    variant: "destructive",
                })
            );
        });
    });
});
