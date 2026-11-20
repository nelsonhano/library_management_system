import React from "react";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import UserTable from "@/components/admin/UserTable";
import UserSearchFilter from "@/components/admin/UserSearchFilter";
import Pagination from "@/components/admin/Pagination";

interface PageProps {
    searchParams: Promise<{
        query?: string;
        status?: string;
        page?: string;
    }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.query?.trim() || "";
    const rawStatus = resolvedParams.status?.trim()?.toUpperCase() || "ALL";
    const status =
        rawStatus === "APPROVED" ||
        rawStatus === "PENDING" ||
        rawStatus === "REJECTED"
            ? rawStatus
            : "ALL";

    const rawPage = parseInt(resolvedParams.page || "1", 10);
    const requestedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const conditions = [];

    if (query) {
        const searchPattern = `%${query}%`;
        const numQuery = parseInt(query, 10);

        if (!isNaN(numQuery) && String(numQuery) === query) {
            conditions.push(
                or(
                    ilike(users.fullName, searchPattern),
                    ilike(users.email, searchPattern),
                    eq(users.universityId, numQuery)
                )
            );
        } else {
            conditions.push(
                or(
                    ilike(users.fullName, searchPattern),
                    ilike(users.email, searchPattern)
                )
            );
        }
    }

    if (status !== "ALL") {
        conditions.push(eq(users.status, status));
    }

    const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);
    const totalUsers = countResult?.count ?? 0;

    const limit = 10;
    const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
    const currentPage = Math.max(1, Math.min(requestedPage, totalPages));
    const offset = (currentPage - 1) * limit;

    const userList = await db
        .select({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            universityId: users.universityId,
            universityCard: users.universityCard,
            status: users.status,
            role: users.role,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt));

    return (
        <section className="w-full space-y-6 rounded-2xl bg-white p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-dark-400">All Users</h2>
                    <p className="text-xs text-light-500">
                        Manage registered library members, monitor account approval statuses, and verify university credentials.
                    </p>
                </div>
            </div>

            <UserSearchFilter
                initialQuery={query}
                initialStatus={status}
            />

            <UserTable users={userList} />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalUsers}
                limit={limit}
                baseUrl="/admin/users"
                query={query}
                status={status}
                itemLabel="users"
            />
        </section>
    );
}
