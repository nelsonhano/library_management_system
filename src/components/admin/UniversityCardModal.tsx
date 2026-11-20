"use client";

import React, { useState } from "react";
import Image from "next/image";
import { IKImage } from "imagekitio-next";
import config from "@/lib/config";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const {
    env: {
        imageKit: { urlEndpoint },
    },
} = config;

interface UniversityCardModalProps {
    cardPath?: string | null;
    studentName: string;
    universityId: number | string;
}

export default function UniversityCardModal({
    cardPath,
    studentName,
    universityId,
}: UniversityCardModalProps) {
    const [open, setOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const isFullUrl = cardPath?.startsWith("http");
    const fullImageUrl = cardPath
        ? isFullUrl
            ? cardPath
            : `${urlEndpoint?.replace(/\/$/, "")}/${cardPath.replace(/^\//, "")}`
        : null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-admin hover:underline"
                >
                    <Image
                        src="/icons/admin/eye.svg"
                        alt="view"
                        width={14}
                        height={14}
                        className="object-contain"
                    />
                    <span>View Card</span>
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-lg border-light-400 bg-white text-dark-400 sm:rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-dark-400">
                        University ID Card
                    </DialogTitle>
                    <DialogDescription className="text-xs text-light-500">
                        {studentName} • Student ID: {universityId}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mt-2 flex min-h-64 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-light-300 bg-light-100 p-2">
                    {imageError || !cardPath ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-light-500">
                            <Image
                                src="/icons/admin/info.svg"
                                alt="error"
                                width={32}
                                height={32}
                                className="mb-2 opacity-60"
                            />
                            <p className="font-medium text-dark-300">ID card image could not be loaded</p>
                            <p className="mt-1 text-xs text-light-500">
                                Path: {cardPath || "No image uploaded"}
                            </p>
                        </div>
                    ) : (
                        <div className="relative h-72 w-full">
                            <IKImage
                                path={!isFullUrl ? cardPath : undefined}
                                src={isFullUrl ? cardPath : undefined}
                                urlEndpoint={urlEndpoint}
                                alt={`University card for ${studentName}`}
                                fill
                                className="rounded object-contain"
                                onError={() => setImageError(true)}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    {fullImageUrl && !imageError ? (
                        <a
                            href={fullImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-admin hover:underline"
                        >
                            <Image
                                src="/icons/admin/link.svg"
                                alt="link"
                                width={12}
                                height={12}
                            />
                            <span>Open in new tab</span>
                        </a>
                    ) : (
                        <div />
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="text-xs"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
