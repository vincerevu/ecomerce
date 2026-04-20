"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { buildCartItemFromProduct, hasDiscount, Product } from "@/types/product";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import Link from "next/link";
import { syncAddCartItem } from "@/libs/cart-sync";

const ProductItem = ({ item }: { item: Product }) => {
  const dispatch = useDispatch<AppDispatch>();
  const showDiscount = hasDiscount(item);
  const [selectedColorId, setSelectedColorId] = useState(item.colors[0]?.id || "");

  useEffect(() => {
    setSelectedColorId(item.colors[0]?.id || "");
  }, [item.id, item.colors]);

  const selectedColor = useMemo(
    () => item.colors.find((color) => color.id === selectedColorId) || item.colors[0],
    [item.colors, selectedColorId]
  );

  const previewImage = selectedColor?.images[0] || item.imgs.previews[0];

  // Calculate discount percentage
  const discountPercent =
    showDiscount && item.price > 0
      ? Math.round(((item.price - item.discountedPrice) / item.price) * 100)
      : 0;

  // add to cart
  const handleAddToCart = () => {
    if (!item.inStock) {
      return;
    }
    syncAddCartItem(
      buildCartItemFromProduct(item, {
        colorId: selectedColor?.id,
        quantity: 1,
      })
    ).catch((error) => {
      console.error("Không thể thêm vào giỏ hàng", error);
    });
  };

  const handleItemToWishList = () => {
    dispatch(
      addItemToWishlist({
        ...item,
        status: "available",
        quantity: 1,
      })
    );
  };

  const handleProductDetails = () => {
    dispatch(updateproductDetails({ ...item }));
  };

  // Mock color variants
  const colorVariants = item.colors.slice(0, 4);
  const productHref = `/shop-details/${item.slug}`;

  return (
    <div className="group h-full flex flex-col">
      <div className="relative overflow-hidden flex items-center justify-center bg-gray-1 h-[320px] mb-3 rounded-lg">
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 z-10 bg-red text-white text-xs font-semibold px-2 py-1 rounded">
            -{discountPercent}%
          </div>
        )}

        <Image
          src={previewImage}
          alt={item.title}
          width={250}
          height={320}
          className="object-cover w-full h-full"
        />

        <div className="absolute left-0 bottom-0 translate-y-full w-full flex items-center justify-center gap-2.5 pb-5 ease-linear duration-200 group-hover:translate-y-0">
          <button
            onClick={() => handleAddToCart()}
            disabled={!item.inStock}
            className={`inline-flex font-medium text-custom-sm py-[7px] px-5 rounded-[5px] ease-out duration-200 ${
              item.inStock
                ? "bg-yellow-light text-dark hover:bg-yellow"
                : "cursor-not-allowed bg-gray-3 text-dark-4"
            }`}
          >
            {item.inStock ? "Thêm vào giỏ" : "Hết hàng"}
          </button>

          <button
            onClick={() => handleItemToWishList()}
            aria-label="button for favorite select"
            id="favOne"
            className="flex items-center justify-center w-9 h-9 rounded-[5px] shadow-1 ease-out duration-200 text-dark bg-white hover:text-blue"
          >
            <svg
              className="fill-current"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.74949 2.94946C2.6435 3.45502 1.83325 4.65749 1.83325 6.0914C1.83325 7.55633 2.43273 8.68549 3.29211 9.65318C4.0004 10.4507 4.85781 11.1118 5.694 11.7564C5.89261 11.9095 6.09002 12.0617 6.28395 12.2146C6.63464 12.491 6.94747 12.7337 7.24899 12.9099C7.55068 13.0862 7.79352 13.1667 7.99992 13.1667C8.20632 13.1667 8.44916 13.0862 8.75085 12.9099C9.05237 12.7337 9.3652 12.491 9.71589 12.2146C9.90982 12.0617 10.1072 11.9095 10.3058 11.7564C11.142 11.1118 11.9994 10.4507 12.7077 9.65318C13.5671 8.68549 14.1666 7.55633 14.1666 6.0914C14.1666 4.65749 13.3563 3.45502 12.2503 2.94946C11.1759 2.45832 9.73214 2.58839 8.36016 4.01382C8.2659 4.11175 8.13584 4.16709 7.99992 4.16709C7.864 4.16709 7.73393 4.11175 7.63967 4.01382C6.26769 2.58839 4.82396 2.45832 3.74949 2.94946ZM7.99992 2.97255C6.45855 1.5935 4.73256 1.40058 3.33376 2.03998C1.85639 2.71528 0.833252 4.28336 0.833252 6.0914C0.833252 7.86842 1.57358 9.22404 2.5444 10.3172C3.32183 11.1926 4.2734 11.9253 5.1138 12.5724C5.30431 12.7191 5.48911 12.8614 5.66486 12.9999C6.00636 13.2691 6.37295 13.5562 6.74447 13.7733C7.11582 13.9903 7.53965 14.1667 7.99992 14.1667C8.46018 14.1667 8.88401 13.9903 9.25537 13.7733C9.62689 13.5562 9.99348 13.2691 10.335 12.9999C10.5107 12.8614 10.6955 12.7191 10.886 12.5724C11.7264 11.9253 12.678 11.1926 13.4554 10.3172C14.4263 9.22404 15.1666 7.86842 15.1666 6.0914C15.1666 4.28336 14.1434 2.71528 12.6661 2.03998C11.2673 1.40058 9.54129 1.5935 7.99992 2.97255Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2 flex-1 flex flex-col justify-between">
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg text-dark">
            {item.discountedPrice.toLocaleString()}đ
          </span>
          {showDiscount && (
            <span className="text-sm text-dark-4 line-through">
              {item.price.toLocaleString()}đ
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3
          className="font-normal text-sm text-dark ease-out duration-200 hover:text-blue cursor-pointer line-clamp-2"
          onClick={() => handleProductDetails()}
        >
          <Link href={productHref}>{item.title}</Link>
        </h3>

        {/* Color Variants */}
        {colorVariants.length > 0 && (
          <div className="flex items-center gap-1.5">
            {colorVariants.map((variant, index) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedColorId(variant.id)}
                className={`w-5 h-5 rounded-full border-2 transition-colors ${
                  selectedColor?.id === variant.id
                    ? "border-yellow"
                    : "border-gray-3 hover:border-blue"
                }`}
                style={{ backgroundColor: variant.hexCode }}
                title={variant.name}
                aria-label={`Màu ${variant.name}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductItem;
