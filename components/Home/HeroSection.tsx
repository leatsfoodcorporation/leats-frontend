'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
}

interface HeroSectionProps {
  banners: Banner[];
}

export default function HeroSection({ banners }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Auto-slide effect
  useEffect(() => {
    if (banners.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // Touch event handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swipe left - go to next
      goToNext();
    }

    if (touchStartX.current - touchEndX.current < -50) {
      // Swipe right - go to previous
      goToPrev();
    }
  };

  // Don't render if no banners
  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="container mx-auto px-2 xs:px-3 sm:px-4 md:px-6 py-2 xs:py-3 sm:py-4">
        {/* Main Banner Slider */}
        <div 
          className="relative rounded-md xs:rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden group shadow-md sm:shadow-lg md:shadow-xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Banner Container - Responsive Heights */}
          <div className="relative w-full h-[140px] xs:h-[160px] sm:h-[200px] md:h-[260px] lg:h-[320px] xl:h-[380px] 2xl:h-[420px]">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Banner Link Wrapper */}
                <Link href={banner.linkUrl || '/products'} className="block w-full h-full">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 375px) 100vw, (max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, 1536px"
                    className="object-cover object-center"
                    priority={index === 0}
                    quality={90}
                    loading={index === 0 ? undefined : 'lazy'}
                  />
                </Link>
              </div>
            ))}
          </div>

          {/* Navigation Arrows - Only show if more than 1 banner */}
          {banners.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={goToPrev}
                type="button"
                className="absolute left-1 xs:left-2 sm:left-3 md:left-4 lg:left-5 top-1/2 -translate-y-1/2 z-30 
                  w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12
                  bg-white/90 hover:bg-white active:bg-gray-100
                  rounded-full flex items-center justify-center 
                  shadow-md hover:shadow-lg
                  transition-all duration-300 
                  hover:scale-110 active:scale-95
                  backdrop-blur-sm
                  pointer-events-auto"
                aria-label="Previous slide"
              >
                <IconChevronLeft className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 pointer-events-none" />
              </button>

              {/* Next Button */}
              <button
                onClick={goToNext}
                type="button"
                className="absolute right-1 xs:right-2 sm:right-3 md:right-4 lg:right-5 top-1/2 -translate-y-1/2 z-30 
                  w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12
                  bg-white/90 hover:bg-white active:bg-gray-100
                  rounded-full flex items-center justify-center 
                  shadow-md hover:shadow-lg
                  transition-all duration-300 
                  hover:scale-110 active:scale-95
                  backdrop-blur-sm
                  pointer-events-auto"
                aria-label="Next slide"
              >
                <IconChevronRight className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 pointer-events-none" />
              </button>

              {/* Dots Indicator - Responsive */}
              <div className="absolute bottom-1.5 xs:bottom-2 sm:bottom-3 md:bottom-4 lg:bottom-5 left-1/2 -translate-x-1/2 z-20 
                flex gap-1 xs:gap-1.5 sm:gap-2
                bg-black/20 backdrop-blur-sm rounded-full px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1 sm:py-1.5">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`rounded-full transition-all duration-300 ease-in-out
                      ${index === currentSlide 
                        ? 'bg-[#e63946] w-4 xs:w-5 sm:w-6 md:w-7 h-1 xs:h-1.5 sm:h-2 shadow-md' 
                        : 'bg-white/60 hover:bg-white/90 w-1 xs:w-1.5 sm:w-2 h-1 xs:h-1.5 sm:h-2'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === currentSlide ? 'true' : 'false'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}