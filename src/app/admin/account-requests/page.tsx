import React from "react";
import Link from "next/link";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import AccountRequestsTable from "@/components/admin/AccountRequestsTable";
import { cn } from "@/lib/utils";

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function AccountRequestsPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const rawStatus = resolvedParams.status?.toUpperCase();

    const activeStatus: "PENDING" | "APPROVED" | "REJECTED" =
        rawStatus === "APPROVED" || rawStatus === "REJECTED"
            ? rawStatus
            : "PENDING";

    const candidateUsers = await db
        .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            universityId: users.universityId,
            universityCard: users.universityCard,
            status: users.status,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(
            and(
                eq(users.role, "USER"),
                eq(users.status, activeStatus)
            )
        )
        .orderBy(desc(users.createdAt));

    const statusCounts = await db
        .select({
            status: users.status,
            count: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(eq(users.role, "USER"))
        .groupBy(users.status);

    const countsMap = statusCounts.reduce(
        (acc, item) => {
            if (item.status) {
                acc[item.status] = item.count;
            }
            return acc;
        },
        { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>,
    );

    const tabs: Array<{
        key: "PENDING" | "APPROVED" | "REJECTED";
        label: string;
        count: number;
    }> = [
        { key: "PENDING", label: "Pending", count: countsMap.PENDING || 0 },
        { key: "APPROVED", label: "Approved", count: countsMap.APPROVED || 0 },
        { key: "REJECTED", label: "Rejected", count: countsMap.REJECTED || 0 },
    ];

    return (
        <section className="w-full rounded-2xl bg-white p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-light-400 pb-5">
                <div>
                    <h2 className="text-xl font-semibold text-dark-400">
                        Account Registration Requests
                    </h2>
                    <p className="mt-1 text-xs text-light-500">
                        Inspect uploaded student identification cards and manage library borrowing eligibility
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-light-300 p-1">
                    {tabs.map((tab) => {
                        const isActive = activeStatus === tab.key;
                        return (
                            <Link
                                key={tab.key}
                                href={`/admin/account-requests?status=${tab.key}`}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                                    isActive
                                        ? "bg-white text-primary-admin shadow-sm"
                                        : "text-dark-200 hover:text-dark-400",
                                )}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={cn(
                                        "rounded-full px-1.5 py-0.2 text-[10px]",
                                        isActive
                                            ? "bg-primary-admin/10 text-primary-admin font-semibold"
                                            : "bg-light-400 text-light-500",
                                    )}
                                >
                                    {tab.count}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="mt-7">
                <AccountRequestsTable
                    requests={candidateUsers}
                    currentTab={activeStatus}
                />
            </div>
        </section>
    );
}
