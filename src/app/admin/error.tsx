"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Admin dashboard error:", error);
    }, [error]);

    return (
        <section className="w-full rounded-2xl bg-white p-7">
            <div className="error-fallback flex flex-col gap-3">
                <h2 className="text-lg font-semibold text-red-800">
                    Something went wrong loading administrative data
                </h2>
                <p className="text-sm text-red-700">
                    {error?.message ||
                        "An unexpected error occurred while communicating with the database."}
                </p>
                <div>
                    <Button
                        onClick={() => reset()}
                        className="bg-primary-admin text-white hover:bg-primary-admin/90"
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        </section>
    );
}
