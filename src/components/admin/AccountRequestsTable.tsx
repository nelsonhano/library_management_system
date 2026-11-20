"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import UniversityCardModal from "./UniversityCardModal";
import { changeUserAccountStatus } from "@/lib/admin/actions/user";

export interface AccountRequestUser {
    id: string;
    fullName: string;
    email: string;
    universityId: number;
    universityCard: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | null;
    createdAt: Date | string | null;
}

interface AccountRequestsTableProps {
    requests: AccountRequestUser[];
    currentTab: "PENDING" | "APPROVED" | "REJECTED";
}

export default function AccountRequestsTable({
    requests,
    currentTab,
}: AccountRequestsTableProps) {
    const router = useRouter();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleStatusChange = async (
        userId: string,
        newStatus: "PENDING" | "APPROVED" | "REJECTED",
    ) => {
        setUpdatingId(userId);

        try {
            const result = await changeUserAccountStatus({
                userId,
                status: newStatus,
            });

            if (result.success) {
                toast({
                    title: "Status updated",
                    description: `Account has been marked as ${newStatus.toLowerCase()}.`,
                });
                router.refresh();
            } else {
                toast({
                    title: "Update failed",
                    description: result.error || "Could not update account status.",
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Unexpected error",
                description: "An unexpected error occurred while updating status.",
                variant: "destructive",
            });
        } finally {
            setUpdatingId(null);
        }
    };

    if (requests.length === 0) {
        return (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-light-400 bg-white p-8 text-center">
                <p className="font-semibold text-dark-300">
                    No {currentTab.toLowerCase()} account requests found
                </p>
                <p className="mt-1 text-xs text-light-500">
                    {currentTab === "PENDING"
                        ? "All student registration requests have been reviewed."
                        : `No student accounts currently match status ${currentTab.toLowerCase()}.`}
                </p>
            </div>
        );
    }

    const renderBadge = (status: string | null) => {
        switch (status) {
            case "APPROVED":
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Approved
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Pending
                    </Badge>
                );
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-light-400 bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-light-400 bg-light-300">
                        <TableHead className="font-semibold text-dark-400">Student</TableHead>
                        <TableHead className="font-semibold text-dark-400">University ID</TableHead>
                        <TableHead className="font-semibold text-dark-400">ID Document</TableHead>
                        <TableHead className="font-semibold text-dark-400">Registered On</TableHead>
                        <TableHead className="font-semibold text-dark-400">Status</TableHead>
                        <TableHead className="text-right font-semibold text-dark-400">Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {requests.map((user) => {
                        const isUpdating = updatingId === user.id;
                        const formattedDate = user.createdAt
                            ? dayjs(user.createdAt).format("MMM DD, YYYY")
                            : "N/A";

                        return (
                            <TableRow key={user.id} className="border-b border-light-400">
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-dark-400">{user.fullName}</p>
                                        <p className="text-xs text-light-500">{user.email}</p>
                                    </div>
                                </TableCell>

                                <TableCell className="font-mono text-xs text-dark-300">
                                    {user.universityId}
                                </TableCell>

                                <TableCell>
                                    <UniversityCardModal
                                        cardPath={user.universityCard}
                                        studentName={user.fullName}
                                        universityId={user.universityId}
                                    />
                                </TableCell>

                                <TableCell className="text-xs text-light-500">
                                    {formattedDate}
                                </TableCell>

                                <TableCell>{renderBadge(user.status)}</TableCell>

                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {user.status === "PENDING" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={() => handleStatusChange(user.id, "APPROVED")}
                                                    className="bg-emerald-600 text-xs text-white hover:bg-emerald-700 h-8 px-3"
                                                >
                                                    {isUpdating ? "Updating..." : "Approve"}
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={isUpdating}
                                                    onClick={() => handleStatusChange(user.id, "REJECTED")}
                                                    className="text-xs h-8 px-3"
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}

                                        {user.status === "APPROVED" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isUpdating}
                                                    onClick={() => handleStatusChange(user.id, "PENDING")}
                                                    className="border-light-400 text-xs text-dark-300 h-8 px-2.5"
                                                >
                                                    Set Pending
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={isUpdating}
                                                    onClick={() => handleStatusChange(user.id, "REJECTED")}
                                                    className="text-xs h-8 px-3"
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}

                                        {user.status === "REJECTED" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    disabled={isUpdating}
                                                    onClick={() => handleStatusChange(user.id, "APPROVED")}
                                                    className="bg-emerald-600 text-xs text-white hover:bg-emerald-700 h-8 px-3"
                                                >
                                                    Approve
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isUpdating}
                                                    onClick={() => handleStatusChange(user.id, "PENDING")}
                                                    className="border-light-400 text-xs text-dark-300 h-8 px-2.5"
                                                >
                                                    Set Pending
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
