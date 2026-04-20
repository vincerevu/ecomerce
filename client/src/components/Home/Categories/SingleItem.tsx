import { CATEGORY_PLACEHOLDER, Category } from "@/types/category";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const SingleItem = ({ item }: { item: Category }) => {
  const isPlaceholderImage = item.img === CATEGORY_PLACEHOLDER;
  const fallbackLabel = item.title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Link
      href={`/products?category=${item.slug}`}
      className="group flex flex-col items-center"
    >
      <div className="max-w-[130px] w-full bg-[#F2F3F8] h-32.5 rounded-full flex items-center justify-center mb-4 overflow-hidden">
        {isPlaceholderImage ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFF6E3] via-white to-[#EEF3FA] text-2xl font-semibold text-dark">
            {fallbackLabel}
          </div>
        ) : (
          <Image
            src={item.img}
            alt={item.title}
            width={130}
            height={130}
            className="object-cover w-full h-full"
          />
        )}
      </div>

      <div className="flex justify-center">
        <h3 className="inline-block font-medium text-center text-dark bg-gradient-to-r from-blue to-blue bg-[length:0px_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 hover:bg-[length:100%_3px] group-hover:bg-[length:100%_1px] group-hover:text-blue">
          {item.title}
        </h3>
      </div>
    </Link>
  );
};

export default SingleItem;
