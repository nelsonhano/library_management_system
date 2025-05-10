"use client";

import { cn } from '@/lib/utils';
import React from 'react'
import BookCoverSvg from './BookCoverSvg';
import { IKImage } from 'imagekitio-next';
import config from "@/lib/config";

const { env: { imageKit: { urlEndpoint } } } = config;

type BookCoverVariant = "extraSmall"|"small"|"medium"|"regular"|"wide";

const variantStyle: Record<BookCoverVariant, string> = {
  extraSmall: "book-cover_extra_small",
  small: "book-cover_small",
  medium: "book-cover_medium",
  regular: "book-cover_regular",
  wide: "book-cover_wide",
}

interface BooksProps{
  className? : string,
  variant?: BookCoverVariant,
  coverColor: string,
  coverImage: string,
}

export default function BookCover(
  { 
    className, 
    variant ="regular", 
    coverColor="#012B48", 
    coverImage="https://placehold.co/400x600.png"  }: BooksProps
  ) {
  return (
    <div className={cn(
      "relative transition-all duration-300",
      variantStyle[variant],
      className 
      )}>
      <BookCoverSvg 
        coverColor={coverColor}
      />

      <div
        className='absolute z-10'
        style={{ left: "12%", width: "87.5%", height: "88%" }}
      >
        <IKImage 
          path={coverImage} 
          urlEndpoint={urlEndpoint}
          alt='Book Cover'
          fill
          loading='lazy'
          lqip={{ active: true }}
          className='rounded-sm object-fill'
        />
      </div>
    </div>
  )
}
