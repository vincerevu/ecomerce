"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import Image from "next/image";
import { getHomeMainBanners, Banner } from "@/libs/content-api";
import Link from "next/link";

// Import Swiper styles
import "swiper/css/pagination";
import "swiper/css";

const YodySlider = () => {
  const [slides, setSlides] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      const banners = await getHomeMainBanners();
      setSlides(banners);
      setLoading(false);
    };
    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="w-full aspect-[2880/900] min-h-[300px] bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Đang tải banner...</span>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="w-full relative group">
      <Swiper
        spaceBetween={0}
        centeredSlides={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        modules={[Autoplay, Pagination, Navigation]}
        className="w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <Link href={slide.linkUrl || "#"} className="block relative w-full aspect-[2880/900] min-h-[300px]">
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                className="object-cover"
                priority={slide.id === slides[0].id}
              />
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <button className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white">
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white">
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Styles for custom pagination dots */}
      <style jsx global>{`
        .swiper-pagination-bullet-active {
          background: #3B82F6 !important;
        }
      `}</style>
    </div>
  );
};

export default YodySlider;
