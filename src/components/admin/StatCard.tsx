import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface StatCardProps {
    title: string;
    count: number;
    icon: string;
    href?: string;
}

export default function StatCard({ title, count, icon, href }: StatCardProps) {
    const cardContent = (
        <div className="stat transition-shadow duration-200 hover:shadow-md">
            <div className="stat-info">
                <p className="stat-label">{title}</p>
                <div className="relative size-6">
                    <Image
                        src={icon}
                        alt={title}
                        fill
                        className="object-contain"
                    />
                </div>
            </div>
            <p className="stat-count">{count}</p>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="flex-1 min-w-[220px]">
                {cardContent}
            </Link>
        );
    }

    return <div className="flex-1 min-w-[220px]">{cardContent}</div>;
}
