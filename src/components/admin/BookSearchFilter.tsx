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

interface BookSearchFilterProps {
    initialQuery?: string;
    initialGenre?: string;
    genres: string[];
}

export default function BookSearchFilter({
    initialQuery = "",
    initialGenre = "ALL",
    genres,
}: BookSearchFilterProps) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [genre, setGenre] = useState(initialGenre);

    const applyFilter = (newQuery: string, newGenre: string) => {
        const params = new URLSearchParams();
        if (newQuery.trim()) {
            params.set("query", newQuery.trim());
        }
        if (newGenre && newGenre !== "ALL") {
            params.set("genre", newGenre);
        }
        const queryString = params.toString();
        router.push(`/admin/books${queryString ? `?${queryString}` : ""}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter(query, genre);
    };

    const handleGenreChange = (newGenre: string) => {
        setGenre(newGenre);
        applyFilter(query, newGenre);
    };

    const handleClear = () => {
        setQuery("");
        setGenre("ALL");
        router.push("/admin/books");
    };

    const hasActiveFilters = Boolean(
        query.trim() || (genre && genre !== "ALL")
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
                    placeholder="Search by title or author..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-10 pl-9 pr-3 text-sm"
                />
            </div>

            <div className="w-[180px]">
                <Select value={genre} onValueChange={handleGenreChange}>
                    <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="All Genres" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="ALL">All Genres</SelectItem>
                        {genres.map((g) => (
                            <SelectItem key={g} value={g}>
                                {g}
                            </SelectItem>
                        ))}
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
                    className="h-10 px-3 text-sm text-light-500 hover:text-dark-400"
                >
                    <X className="mr-1 h-4 w-4" />
                    Clear
                </Button>
            )}
        </form>
    );
}
