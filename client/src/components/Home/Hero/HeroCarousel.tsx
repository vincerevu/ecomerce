"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css/pagination";
import "swiper/css";

import Image from "next/image";

type HeroSlide = {
  id: string;
  title: string;
  eyebrow: string;
  accentText: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  backgroundColor: string;
  accentColor: string;
  priceText: string;
  compareAtText: string;
  endAt: string | null;
  sortOrder: number;
};

type HeroCarouselProps = {
  slides?: HeroSlide[];
};

const fallbackSlides: HeroSlide[] = [
  {
    id: "hero-fallback-1",
    title: "Bộ sưu tập thời trang mùa hè 2026",
    eyebrow: "30%",
    accentText: "Giảm giá 30%",
    description:
      "Khám phá bộ sưu tập thời trang mới nhất với phong cách hiện đại và trẻ trung, phù hợp cho mọi hoạt động.",
    ctaText: "Mua ngay",
    ctaUrl: "/products",
    imageUrl: "/images/hero/hero-01.png",
    backgroundColor: "#FFFFFF",
    accentColor: "#FFC954",
    priceText: "",
    compareAtText: "",
    endAt: null,
    sortOrder: 1,
  },
];

const HeroCarousal = ({ slides = fallbackSlides }: HeroCarouselProps) => {
  const safeSlides = slides.length > 0 ? slides : fallbackSlides;

  return (
    <Swiper
      spaceBetween={30}
      centeredSlides={true}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
      }}
      pagination={{
        clickable: true,
      }}
      modules={[Autoplay, Pagination]}
      className="hero-carousel"
    >
      {safeSlides.map((slide) => (
        <SwiperSlide key={slide.id}>
          <div className="flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row">
            <div className="max-w-[394px] py-10 sm:py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5">
              <div className="flex items-center gap-4 mb-7.5 sm:mb-10">
                <span
                  className="block font-semibold text-heading-3 sm:text-heading-1"
                  style={{ color: slide.accentColor }}
                >
                  {slide.eyebrow}
                </span>
                <span className="block text-dark text-sm sm:text-custom-1 sm:leading-[24px]">
                  {slide.accentText || "Khám phá ngay"}
                </span>
              </div>

              <h1 className="font-semibold text-dark text-xl sm:text-3xl mb-3">
                <a href={slide.ctaUrl}>{slide.title}</a>
              </h1>

              <p>{slide.description}</p>

              <a
                href={slide.ctaUrl}
                className="inline-flex font-medium text-dark text-custom-sm rounded-full bg-blue py-2.5 px-7 ease-out duration-200 hover:bg-blue-dark mt-8"
              >
                {slide.ctaText || "Mua ngay"}
              </a>
            </div>

            <div>
              <Image
                src={slide.imageUrl || "/images/hero/hero-01.png"}
                alt={slide.title}
                width={351}
                height={358}
              />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default HeroCarousal;
