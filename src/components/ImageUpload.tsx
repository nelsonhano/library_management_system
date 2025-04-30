"use client";

import { IKImage, IKUpload, ImageKitProvider } from "imagekitio-next";
import { useRef, useState } from "react";
import Image from "next/image";

import { useToast } from "@/hooks/use-toast";
import config from "@/lib/config";

const authenticator = async () => {
  const { env: { apiEndPoint } } = config;
  
  try {
    const response = await fetch(`${apiEndPoint}/api/auth/imagekit`);

    if (!response.ok) {
      const errorText = await response.text();
      
      throw new Error(`Reqest failed with status ${response.status}: ${errorText}`)
    };

    const data = await response.json();
    const { expire, signature, token } = data;
    
    return { expire, signature, token };
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`)
  }
}

const {
  env: {
    imaageKit: {
      publicKey,
      urlEndpoint,
    }
  }
} = config;

export default function ImageUpload({
  onFileChange
}: {
  onFileChange: (filePath: string) => void
}) {
  const [ file, setFile ] = useState<{ filePath: string } | null>(null);
  const ikUploadRef = useRef(null);
  const { toast } = useToast()
  
  const onError = (res: any) => {
    console.log(res);

    toast({
      title: "Image upload failed",
      description: `Your image could not be uploaded. please try again.`,
      variant: "destructive",
    });
  };
  const onSuccess = (res: any) => {
    setFile(res);
    onFileChange(res.filePath);

    toast({
      title: `${res.type} uploaded successfully`,
      description: `${res.filePath} uploaded successfully!`,
    });
  };
  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <IKUpload 
        className="hidden"
        ref={ikUploadRef}
        onError={onError}
        onSuccess={onSuccess}
        fileName="test-upload.png"
      />

      <button
        className="upload-btn"
        onClick={(e) => {
          e.preventDefault();

          if (ikUploadRef.current) {
            // @ts-ignore
            ikUploadRef.current?.click();
          }
        }}
      >
        <Image 
          src="/icons/upload.svg"
          alt="upload-icon"
          width={20}
          height={20}
          className="object-contain"
        />

      </button>
      <p className="text-base text-lime-100">Upload a file</p>

      {file && <p className="upload-filename">{file.filePath}</p>}
      {file && (
        <IKImage
        path={file.filePath}
        alt={file.filePath}
        height={500}
        width={300}
        />
      )}
    </ImageKitProvider>
  )
}
