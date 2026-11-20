"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserSearchFilterProps {
    initialQuery?: string;
    initialStatus?: string;
}

export default function UserSearchFilter({
    initialQuery = "",
    initialStatus = "ALL",
}: UserSearchFilterProps) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState(initialStatus);

    const applyFilter = (newQuery: string, newStatus: string) => {
        const params = new URLSearchParams();
        if (newQuery.trim()) {
            params.set("query", newQuery.trim());
        }
        if (newStatus && newStatus !== "ALL") {
            params.set("status", newStatus);
        }
        const queryString = params.toString();
        router.push(`/admin/users${queryString ? `?${queryString}` : ""}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter(query, status);
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        applyFilter(query, newStatus);
    };

    const handleClear = () => {
        setQuery("");
        setStatus("ALL");
        router.push("/admin/users");
    };

    const hasActiveFilters = Boolean(
        query.trim() || (status && status !== "ALL")
    );

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-3"
        >
            <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-500" />
                <Input
                    type="text"
                    placeholder="Search by name, email, or student ID..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-10 pl-9 pr-3 text-sm"
                />
            </div>

            <div className="w-[180px]">
                <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button
                type="submit"
                className="h-10 bg-primary-admin px-4 text-sm text-white hover:bg-primary-admin/90"
            >
                Search
            </Button>

            {hasActiveFilters && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClear}
                    className="h-10 gap-1 px-3 text-sm text-light-500 hover:text-dark-400"
                >
                    <X className="h-4 w-4" />
                    Clear
                </Button>
            )}
        </form>
    );
}
