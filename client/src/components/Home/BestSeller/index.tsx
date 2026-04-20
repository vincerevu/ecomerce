"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProductItem from "@/components/Common/ProductItem";
import { Product } from "@/types/product";
import { getProducts } from "@/libs/catalog-api";
import SectionLoader from "@/components/Common/SectionLoader";

const BestSeller = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await getProducts({ page: 0, size: 12, sort: "createdAt,desc" });
        const sorted = [...response.items].sort((left, right) => {
          const leftDiscount = left.price - left.discountedPrice;
          const rightDiscount = right.price - right.discountedPrice;
          return rightDiscount - leftDiscount || right.totalStock - left.totalStock;
        });
        setProducts(sorted.slice(0, 8));
      } catch (loadError) {
        console.error(loadError);
        setError("Không tải được danh sách bán chạy.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <section className="overflow-hidden">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
              <Image src="/images/icons/icon-07.svg" alt="icon" width={17} height={17} />
              Tháng này
            </span>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-dark">
              Bán chạy nhất
            </h2>
          </div>
        </div>

        {isLoading ? (
          <SectionLoader title="Đang tải sản phẩm nổi bật" columns={4} />
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-gray-3 bg-white px-6 py-10 text-center text-dark">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7.5 gap-y-9 auto-rows-fr">
            {products.map((item) => (
              <ProductItem item={item} key={item.id} />
            ))}
          </div>
        )}

        <div className="text-center mt-12.5">
          <Link
            href="/products"
            className="inline-flex font-medium text-custom-sm py-3 px-7 sm:px-12.5 rounded-md border-gray-3 border bg-gray-1 text-dark ease-out duration-200 hover:bg-dark hover:text-white hover:border-transparent"
          >
            Xem tất cả
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
