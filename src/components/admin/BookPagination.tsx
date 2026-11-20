import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookPaginationProps {
    currentPage: number;
    totalPages: number;
    totalBooks: number;
    limit: number;
    query?: string;
    genre?: string;
}

export default function BookPagination({
    currentPage,
    totalPages,
    totalBooks,
    limit,
    query,
    genre,
}: BookPaginationProps) {
    if (totalBooks === 0) {
        return null;
    }

    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalBooks);

    const createPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams();
        if (pageNumber > 1) {
            params.set("page", String(pageNumber));
        }
        if (query && query.trim()) {
            params.set("query", query.trim());
        }
        if (genre && genre !== "ALL") {
            params.set("genre", genre);
        }
        const queryString = params.toString();
        return `/admin/books${queryString ? `?${queryString}` : ""}`;
    };

    const hasPrevious = currentPage > 1;
    const hasNext = currentPage < totalPages;

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <p className="text-sm text-light-500">
                Showing <span className="font-medium text-dark-400">{startItem}</span> to{" "}
                <span className="font-medium text-dark-400">{endItem}</span> of{" "}
                <span className="font-medium text-dark-400">{totalBooks}</span> books
            </p>

            <div className="flex items-center gap-2">
                {hasPrevious ? (
                    <Button variant="outline" size="sm" asChild className="h-9 px-3">
                        <Link href={createPageUrl(currentPage - 1)}>
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Previous
                        </Link>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-9 px-3 opacity-50"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                    </Button>
                )}

                <span className="px-2 text-sm text-dark-400">
                    Page {currentPage} of {totalPages}
                </span>

                {hasNext ? (
                    <Button variant="outline" size="sm" asChild className="h-9 px-3">
                        <Link href={createPageUrl(currentPage + 1)}>
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-9 px-3 opacity-50"
                    >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
