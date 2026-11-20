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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import UniversityCardModal from "./UniversityCardModal";
import { changeUserAccountStatus } from "@/lib/admin/actions/user";
import { getInitials } from "@/lib/utils";

export interface AdminUserRecord {
    id: string;
    fullName: string;
    email: string;
    universityId: number;
    universityCard: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | null;
    role: "USER" | "ADMIN" | null;
    createdAt: Date | string | null;
}

interface UserTableProps {
    users: AdminUserRecord[];
}

export default function UserTable({ users }: UserTableProps) {
    const router = useRouter();
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleStatusChange = async (
        userId: string,
        newStatus: "PENDING" | "APPROVED" | "REJECTED"
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

    if (users.length === 0) {
        return (
            <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-light-400 bg-white p-8 text-center">
                <p className="font-semibold text-dark-300">No users found</p>
                <p className="mt-1 text-xs text-light-500">
                    Try adjusting your search query or status filter to see more users.
                </p>
            </div>
        );
    }

    const renderStatusBadge = (status: string | null) => {
        switch (status) {
            case "APPROVED":
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Approved
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                        Rejected
                    </Badge>
                );
            case "PENDING":
            default:
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Pending
                    </Badge>
                );
        }
    };

    const renderRoleBadge = (role: string | null) => {
        if (role === "ADMIN") {
            return (
                <Badge className="bg-[#ECFDF3] text-[#027A48] hover:bg-[#ECFDF3]">
                    Admin
                </Badge>
            );
        }
        return (
            <Badge className="bg-[#FDF2FA] text-[#C11574] hover:bg-[#FDF2FA]">
                User
            </Badge>
        );
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-light-400">
            <Table>
                <TableHeader className="bg-light-300">
                    <TableRow>
                        <TableHead className="font-semibold text-dark-400">Student</TableHead>
                        <TableHead className="font-semibold text-dark-400">Email</TableHead>
                        <TableHead className="font-semibold text-dark-400">Role</TableHead>
                        <TableHead className="font-semibold text-dark-400">University ID</TableHead>
                        <TableHead className="font-semibold text-dark-400">ID Card</TableHead>
                        <TableHead className="font-semibold text-dark-400">Status</TableHead>
                        <TableHead className="font-semibold text-dark-400">Date Joined</TableHead>
                        <TableHead className="text-right font-semibold text-dark-400">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => {
                        const isUpdating = updatingId === user.id;
                        const formattedDate = user.createdAt
                            ? dayjs(user.createdAt).format("MMM DD, YYYY")
                            : "N/A";

                        return (
                            <TableRow key={user.id} className="hover:bg-light-300/40">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-light-400">
                                            <AvatarFallback className="bg-amber-100 text-xs font-semibold text-blue-900">
                                                {getInitials(user.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-dark-400">
                                                {user.fullName}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="text-sm text-dark-200">
                                    {user.email}
                                </TableCell>

                                <TableCell>{renderRoleBadge(user.role)}</TableCell>

                                <TableCell className="font-mono text-sm text-dark-300">
                                    {user.universityId}
                                </TableCell>

                                <TableCell>
                                    <UniversityCardModal
                                        cardPath={user.universityCard}
                                        studentName={user.fullName}
                                        universityId={user.universityId}
                                    />
                                </TableCell>

                                <TableCell>{renderStatusBadge(user.status)}</TableCell>

                                <TableCell className="text-xs text-light-500">
                                    {formattedDate}
                                </TableCell>

                                <TableCell className="text-right">
                                    {user.role === "ADMIN" ? (
                                        <span className="text-xs text-light-500">
                                            Admin Account
                                        </span>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2">
                                            {user.status !== "APPROVED" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        handleStatusChange(user.id, "APPROVED")
                                                    }
                                                    className="h-8 border-emerald-500 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                                >
                                                    {isUpdating ? "Updating..." : "Approve"}
                                                </Button>
                                            )}

                                            {user.status !== "REJECTED" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isUpdating}
                                                    onClick={() =>
                                                        handleStatusChange(user.id, "REJECTED")
                                                    }
                                                    className="h-8 border-rose-500 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                                >
                                                    {isUpdating ? "Updating..." : "Reject"}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
