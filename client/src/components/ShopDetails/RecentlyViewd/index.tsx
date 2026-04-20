"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ProductItem from "@/components/Common/ProductItem";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/navigation";
import "swiper/css";
import { Product } from "@/types/product";
import { getProducts } from "@/libs/catalog-api";
import SectionLoader from "@/components/Common/SectionLoader";

type RecentlyViewedItemsProps = {
  currentProductId?: string;
  categorySlug?: string;
};

const RecentlyViewdItems = ({
  currentProductId,
  categorySlug,
}: RecentlyViewedItemsProps) => {
  const sliderRef = useRef<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slidePrev();
  }, []);

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return;
    sliderRef.current.swiper.slideNext();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const response = await getProducts({ page: 0, size: 12, sort: "createdAt,desc" });
        const filtered = response.items.filter((item) => item.id !== currentProductId);
        const prioritized = categorySlug
          ? [
              ...filtered.filter((item) => item.categorySlug === categorySlug),
              ...filtered.filter((item) => item.categorySlug !== categorySlug),
            ]
          : filtered;
        setProducts(prioritized.slice(0, 8));
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [categorySlug, currentProductId]);

  return (
    <section className="overflow-hidden pt-17.5">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 pb-15 border-b border-gray-3">
        <div className="swiper categories-carousel common-carousel">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
                <Image
                  src="/images/icons/icon-05.svg"
                  width={17}
                  height={17}
                  alt="icon"
                />
                Gợi ý thêm
              </span>
              <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
                Có thể bạn cũng thích
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handlePrev} className="swiper-button-prev">
                <svg
                  className="fill-current"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.4881 4.43057C15.8026 4.70014 15.839 5.17361 15.5694 5.48811L9.98781 12L15.5694 18.5119C15.839 18.8264 15.8026 19.2999 15.4881 19.5695C15.1736 19.839 14.7001 19.8026 14.4306 19.4881L8.43056 12.4881C8.18981 12.2072 8.18981 11.7928 8.43056 11.5119L14.4306 4.51192C14.7001 4.19743 15.1736 4.161 15.4881 4.43057Z"
                    fill=""
                  />
                </svg>
              </button>

              <button onClick={handleNext} className="swiper-button-next">
                <svg
                  className="fill-current"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.51192 4.43057C8.82641 4.161 9.29989 4.19743 9.56946 4.51192L15.5695 11.5119C15.8102 11.7928 15.8102 12.2072 15.5695 12.4881L9.56946 19.4881C9.29989 19.8026 8.82641 19.839 8.51192 19.5695C8.19743 19.2999 8.161 18.8264 8.43057 18.5119L14.0122 12L8.43057 5.48811C8.161 5.17361 8.19743 4.70014 8.51192 4.43057Z"
                    fill=""
                  />
                </svg>
              </button>
            </div>
          </div>

          {isLoading ? (
            <SectionLoader title="Đang tải gợi ý sản phẩm" columns={4} compact />
          ) : (
            <Swiper
              ref={sliderRef}
              slidesPerView={4}
              spaceBetween={20}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                },
                640: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 4,
                },
              }}
              className="justify-between"
            >
              {products.map((item) => (
                <SwiperSlide key={item.id}>
                  <ProductItem item={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewdItems;
