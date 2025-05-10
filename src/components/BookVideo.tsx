"use client";

import { IKVideo, ImageKitProvider } from "imagekitio-next";
import config from "@/lib/config";

const { env: { imageKit: { publicKey, urlEndpoint } }} = config;

const BookVideo = ({ videoUrl }: { videoUrl: string }) => {
    return (
        <ImageKitProvider
            publicKey={publicKey}
            urlEndpoint={urlEndpoint}
        >
            <IKVideo path={videoUrl} controls={true} className="w-full rounded-xl" />
        </ImageKitProvider>
    );
};
export default BookVideo;