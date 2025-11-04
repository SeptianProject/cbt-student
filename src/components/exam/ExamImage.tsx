'use client';

import { useState } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface ExamImageProps {
     src: string | null | undefined;
     alt: string;
     className?: string;
     priority?: boolean;
     onError?: () => void;
     showFallback?: boolean;
     aspectRatio?: 'auto' | 'square' | '16:9' | '4:3';
}

/**
 * ExamImage Component
 * Handles image display with loading states, error handling, and fallback UI
 * Used for displaying question images and choice images in the exam
 */
export default function ExamImage({
     src,
     alt,
     className = '',
     priority = false,
     onError,
     showFallback = true,
     aspectRatio = 'auto'
}: ExamImageProps) {
     const [imageError, setImageError] = useState(false);
     const [isLoading, setIsLoading] = useState(true);

     // If no src or image failed to load, show fallback
     if (!src || imageError) {
          if (!showFallback) return null;

          return (
               <div className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 ${className}`}>
                    {imageError ? (
                         <>
                              <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 text-center">
                                   Gagal memuat gambar
                              </p>
                         </>
                    ) : (
                         <>
                              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500 text-center">
                                   Tidak ada gambar
                              </p>
                         </>
                    )}
               </div>
          );
     }

     const handleImageError = () => {
          setImageError(true);
          setIsLoading(false);
          if (onError) {
               onError();
          }
     };

     const handleImageLoad = () => {
          setIsLoading(false);
     };

     // Determine aspect ratio classes
     const aspectRatioClass = {
          'auto': '',
          'square': 'aspect-square',
          '16:9': 'aspect-video',
          '4:3': 'aspect-[4/3]'
     }[aspectRatio];

     return (
          <div className={`relative overflow-hidden rounded-lg ${aspectRatioClass} ${className}`}>
               {/* Loading skeleton */}
               {isLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                         <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
               )}

               {/* Image */}
               <Image
                    src={src}
                    alt={alt}
                    fill={aspectRatio !== 'auto'}
                    width={aspectRatio === 'auto' ? 800 : undefined}
                    height={aspectRatio === 'auto' ? 600 : undefined}
                    className={`${aspectRatio === 'auto' ? 'w-full h-auto' : 'object-cover'} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    priority={priority}
                    quality={85}
                    unoptimized // Since we're using external images from Laravel storage
               />
          </div>
     );
}
