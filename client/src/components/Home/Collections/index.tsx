"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductItem from "@/components/Common/ProductItem";
import SectionLoader from "@/components/Common/SectionLoader";
import { getCollectionShowcases } from "@/libs/collection-api";
import { CollectionShowcase } from "@/types/collection";

const ITEMS_PER_PAGE = 5;
const PRODUCT_LIMIT = 12;

const CollectionBlock = ({ collection }: { collection: CollectionShowcase }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(Math.ceil(collection.products.length / ITEMS_PER_PAGE), 1);

  useEffect(() => {
    setPage(0);
  }, [collection.id]);

  const currentItems = useMemo(() => {
    const fromIndex = page * ITEMS_PER_PAGE;
    return collection.products.slice(fromIndex, fromIndex + ITEMS_PER_PAGE);
  }, [collection.products, page]);

  const isVideo = collection.coverMediaType === "VIDEO";

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[24px] bg-[#F3F5F8]">
        {isVideo ? (
          <video
            src={collection.coverMediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img
            src={collection.coverMediaUrl}
            alt={collection.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="relative min-h-[110px] sm:min-h-[140px] lg:min-h-[180px]">
          <Link
            href={`/products?collection=${collection.slug}`}
            aria-label={`Xem tất cả bộ sưu tập ${collection.name}`}
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/92 text-dark shadow-sm backdrop-blur transition hover:border-yellow hover:text-yellow"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 11L11 5M11 5H6.5M11 5V9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      {currentItems.length > 0 ? (
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => {
              const fromIndex = pageIndex * ITEMS_PER_PAGE;
              const pageItems = collection.products.slice(fromIndex, fromIndex + ITEMS_PER_PAGE);

              return (
                <div
                  key={`${collection.id}-page-${pageIndex}`}
                  className="grid min-w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
                >
                  {pageItems.map((product) => (
                    <ProductItem key={`${collection.id}-${product.id}`} item={product} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-3 bg-white px-6 py-10 text-center text-dark">
          Chưa có sản phẩm cho bộ sưu tập này.
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/products?collection=${collection.slug}`}
          className="inline-flex items-center justify-center rounded-full border border-gray-3 bg-white px-4 py-2 text-sm font-medium text-dark transition hover:border-yellow hover:text-yellow"
        >
          Xem tất cả
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPage((current) => (current === 0 ? totalPages - 1 : current - 1))}
            disabled={totalPages <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-3 bg-white text-dark transition hover:border-yellow hover:text-yellow disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M10.5 4.5L6 9L10.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="min-w-[58px] text-center text-sm font-medium text-dark">
            {Math.min(page + 1, totalPages)}/{totalPages}
          </div>

          <button
            type="button"
            onClick={() => setPage((current) => (current + 1) % totalPages)}
            disabled={totalPages <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-3 bg-white text-dark transition hover:border-yellow hover:text-yellow disabled:cursor-not-allowed disabled:opacity-35"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7.5 4.5L12 9L7.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const Collections = () => {
  const [collections, setCollections] = useState<CollectionShowcase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCollections = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getCollectionShowcases({ limit: 4, productLimit: PRODUCT_LIMIT });
        setCollections(data.filter((collection) => collection.products.length > 0));
      } catch (loadError) {
        console.error(loadError);
        setError("Không tải được bộ sưu tập lúc này.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, []);

  if (isLoading) {
    return (
      <section className="overflow-hidden pt-15">
        <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-12 px-4 sm:px-8 xl:px-0">
          <SectionLoader title="Đang tải bộ sưu tập" columns={4} rows={2} />
        </div>
      </section>
    );
  }

  if (error || collections.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden pt-15">
      <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-12 px-4 sm:px-8 xl:px-0">
        {collections.map((collection) => (
          <CollectionBlock key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
};

export default Collections;
