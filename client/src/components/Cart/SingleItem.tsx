"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Product, ProductColor, ProductVariant } from "@/types/product";
import {
  syncRemoveCartItem,
  syncUpdateCartItemQuantity,
  syncUpdateCartItemSelection,
} from "@/libs/cart-sync";
import { useAppSelector } from "@/redux/store";
import { toggleCartItemSelection } from "@/redux/features/cart-slice";
import Checkbox from "../Common/Checkbox";

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}₫`;

const getDisplayImage = (item: any, selectedColor?: ProductColor) =>
  selectedColor?.images?.[0] ||
  item.imageUrl ||
  item.imgs?.thumbnails?.[0] ||
  item.imgs?.previews?.[0] ||
  "/images/arrivals/arrivals-01.png";

const getDefaultVariantForColor = (color?: ProductColor, preferredSize?: string) => {
  if (!color) {
    return undefined;
  }

  return (
    color.variants.find((variant) => variant.sizeName === preferredSize) ||
    color.variants.find((variant) => variant.stockQuantity > 0) ||
    color.variants[0]
  );
};

const SingleItem = ({ item, product }: { item: any; product?: Product }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [quantity, setQuantity] = useState(item.quantity);
  const isSelected = useAppSelector((state) =>
    state.cartReducer.selectedItemIds.includes(item.id)
  );

  const selectedColor = useMemo(
    () =>
      product?.colors.find((color) => color.id === item.colorId) ||
      product?.colors[0],
    [item.colorId, product?.colors]
  );

  const selectedVariant = useMemo(
    () =>
      selectedColor?.variants.find((variant) => variant.id === item.variantId) ||
      getDefaultVariantForColor(selectedColor, item.sizeName),
    [item.sizeName, item.variantId, selectedColor]
  );

  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  useEffect(() => {
    if (!product || !selectedColor || !selectedVariant) {
      return;
    }

    if (
      item.colorId === selectedColor.id &&
      item.variantId === selectedVariant.id &&
      item.discountedPrice === (selectedVariant.salePrice || selectedVariant.originalPrice) &&
      item.price === selectedVariant.originalPrice &&
      item.imageUrl === getDisplayImage(item, selectedColor)
    ) {
      return;
    }

    syncUpdateCartItemSelection(item.id, {
      price: selectedVariant.originalPrice,
      discountedPrice:
        selectedVariant.salePrice || selectedVariant.originalPrice,
      imgs: {
        thumbnails:
          selectedColor.images.length > 0
            ? selectedColor.images
            : item.imgs?.thumbnails || item.imgs?.previews || [],
        previews:
          selectedColor.images.length > 0
            ? selectedColor.images
            : item.imgs?.previews || item.imgs?.thumbnails || [],
      },
      variantId: selectedVariant.id,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      sizeName: selectedVariant.sizeName,
      imageUrl: getDisplayImage(item, selectedColor),
    }).catch((error) => {
      console.error("Không thể đồng bộ lựa chọn giỏ hàng", error);
    });
  }, [dispatch, item, product, selectedColor, selectedVariant]);

  const handleRemoveFromCart = () => {
    syncRemoveCartItem(item.id).catch((error) => {
      console.error("Không thể xóa sản phẩm khỏi giỏ hàng", error);
    });
  };

  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
    syncUpdateCartItemQuantity(item.id, quantity + 1).catch((error) => {
      console.error("Không thể cập nhật số lượng giỏ hàng", error);
      setQuantity(quantity);
    });
  };

  const handleDecreaseQuantity = () => {
    if (quantity <= 1) {
      return;
    }

    setQuantity(quantity - 1);
    syncUpdateCartItemQuantity(item.id, quantity - 1).catch((error) => {
      console.error("Không thể cập nhật số lượng giỏ hàng", error);
      setQuantity(quantity);
    });
  };

  const handleSelectColor = (color: ProductColor) => {
    const nextVariant = getDefaultVariantForColor(color, item.sizeName);
    if (!nextVariant) {
      return;
    }

    syncUpdateCartItemSelection(item.id, {
      price: nextVariant.originalPrice,
      discountedPrice: nextVariant.salePrice || nextVariant.originalPrice,
      imgs: {
        thumbnails: color.images.length > 0 ? color.images : item.imgs?.thumbnails || [],
        previews: color.images.length > 0 ? color.images : item.imgs?.previews || [],
      },
      variantId: nextVariant.id,
      colorId: color.id,
      colorName: color.name,
      sizeName: nextVariant.sizeName,
      imageUrl: getDisplayImage(item, color),
    }).catch((error) => {
      console.error("Không thể cập nhật màu sản phẩm trong giỏ", error);
    });
  };

  const handleSelectSize = (variant: ProductVariant) => {
    if (!selectedColor) {
      return;
    }

    syncUpdateCartItemSelection(item.id, {
      price: variant.originalPrice,
      discountedPrice: variant.salePrice || variant.originalPrice,
      imgs: {
        thumbnails:
          selectedColor.images.length > 0 ? selectedColor.images : item.imgs?.thumbnails || [],
        previews:
          selectedColor.images.length > 0 ? selectedColor.images : item.imgs?.previews || [],
      },
      variantId: variant.id,
      colorId: selectedColor.id,
      colorName: selectedColor.name,
      sizeName: variant.sizeName,
      imageUrl: getDisplayImage(item, selectedColor),
    }).catch((error) => {
      console.error("Không thể cập nhật size sản phẩm trong giỏ", error);
    });
  };

  const linePrice = item.discountedPrice || item.price || 0;
  const subtotal = linePrice * quantity;

  return (
    <div className="flex items-start border-t border-gray-3 py-5 px-7.5">
      <div className="min-w-[400px]">
        <div className="flex items-start gap-5.5">
          <Checkbox
            checked={isSelected}
            onChange={() => dispatch(toggleCartItemSelection(item.id))}
            className="mt-9"
          />

          <div className="flex items-center justify-center rounded-[16px] bg-gray-2 max-w-[100px] w-full h-24 overflow-hidden">
            <Image
              width={200}
              height={200}
              src={getDisplayImage(item, selectedColor)}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-dark text-lg leading-snug">{item.title}</h3>

            {product && product.colors.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-dark-4">Màu:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleSelectColor(color)}
                        aria-label={color.name}
                        className={`h-6 w-6 rounded-full border-2 transition ${
                          item.colorId === color.id
                            ? "border-yellow bg-white"
                            : "border-gray-3 bg-white"
                        }`}
                        style={{ backgroundColor: color.hexCode || "#D1D5DB" }}
                      />
                    ))}
                  </div>
                </div>

                {selectedColor && selectedColor.variants.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-dark-4">Size:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedColor.variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => handleSelectSize(variant)}
                          disabled={variant.stockQuantity <= 0}
                          className={`min-w-11 rounded-full border px-3 py-1.5 text-sm transition ${
                            item.variantId === variant.id
                              ? "border-yellow bg-yellow/10 text-dark"
                              : "border-gray-3 bg-white text-dark"
                          } ${variant.stockQuantity <= 0 ? "cursor-not-allowed opacity-40" : ""}`}
                        >
                          {variant.sizeName}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dark-4">
                {item.colorName ? <span>Màu: {item.colorName}</span> : null}
                {item.sizeName ? <span>Size: {item.sizeName}</span> : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-[180px]">
        <div className="space-y-1">
          <p className="text-dark font-medium">{formatCurrency(linePrice)}</p>
          {item.price > item.discountedPrice ? (
            <p className="text-sm text-dark-4 line-through">
              {formatCurrency(item.price)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-w-[275px]">
        <div className="w-max flex items-center rounded-full border border-gray-3">
          <button
            onClick={handleDecreaseQuantity}
            aria-label="Giảm số lượng"
            className="flex items-center justify-center w-11.5 h-11.5 ease-out duration-200 hover:text-blue"
          >
            <svg
              className="fill-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3.33301 10.0001C3.33301 9.53984 3.7061 9.16675 4.16634 9.16675H15.833C16.2932 9.16675 16.6663 9.53984 16.6663 10.0001C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10.0001Z" />
            </svg>
          </button>

          <span className="flex items-center justify-center w-16 h-11.5 border-x border-gray-4">
            {quantity}
          </span>

          <button
            onClick={handleIncreaseQuantity}
            aria-label="Tăng số lượng"
            className="flex items-center justify-center w-11.5 h-11.5 ease-out duration-200 hover:text-blue"
          >
            <svg
              className="fill-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3.33301 10C3.33301 9.5398 3.7061 9.16671 4.16634 9.16671H15.833C16.2932 9.16671 16.6663 9.5398 16.6663 10C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10Z" />
              <path d="M9.99967 16.6667C9.53944 16.6667 9.16634 16.2936 9.16634 15.8334L9.16634 4.16671C9.16634 3.70647 9.53944 3.33337 9.99967 3.33337C10.4599 3.33337 10.833 3.70647 10.833 4.16671L10.833 15.8334C10.833 16.2936 10.4599 16.6667 9.99967 16.6667Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-w-[200px]">
        <p className="text-dark font-medium">{formatCurrency(subtotal)}</p>
      </div>

      <div className="min-w-[50px] flex justify-end">
        <button
          onClick={handleRemoveFromCart}
          aria-label="Xóa sản phẩm khỏi giỏ hàng"
          className="flex items-center justify-center rounded-full max-w-[42px] w-full h-10.5 bg-gray-2 border border-gray-3 text-dark ease-out duration-200 hover:bg-red-light-6 hover:border-red-light-4 hover:text-red"
        >
          <svg
            className="fill-current"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.45017 2.06252H12.5498C12.7482 2.06239 12.921 2.06228 13.0842 2.08834C13.7289 2.19129 14.2868 2.59338 14.5883 3.17244C14.6646 3.319 14.7192 3.48298 14.7818 3.6712L14.8841 3.97819C14.9014 4.03015 14.9064 4.04486 14.9105 4.05645C15.0711 4.50022 15.4873 4.80021 15.959 4.81217C15.9714 4.81248 15.9866 4.81254 16.0417 4.81254H18.7917C19.1714 4.81254 19.4792 5.12034 19.4792 5.50004C19.4792 5.87973 19.1714 6.18754 18.7917 6.18754H3.20825C2.82856 6.18754 2.52075 5.87973 2.52075 5.50004C2.52075 5.12034 2.82856 4.81254 3.20825 4.81254H5.95833C6.01337 4.81254 6.02856 4.81248 6.04097 4.81217C6.51273 4.80021 6.92892 4.50024 7.08944 4.05647C7.09366 4.0448 7.09852 4.03041 7.11592 3.97819L7.21823 3.67122C7.28083 3.48301 7.33538 3.319 7.41171 3.17244C7.71324 2.59339 8.27112 2.19129 8.91581 2.08834C9.079 2.06228 9.25181 2.06239 9.45017 2.06252ZM8.25739 4.81254C8.30461 4.71993 8.34645 4.6237 8.38245 4.52419C8.39338 4.49397 8.4041 4.4618 8.41787 4.42048L8.50936 4.14601C8.59293 3.8953 8.61217 3.84416 8.63126 3.8075C8.73177 3.61448 8.91773 3.48045 9.13263 3.44614C9.17345 3.43962 9.22803 3.43754 9.49232 3.43754H12.5077C12.772 3.43754 12.8265 3.43962 12.8674 3.44614C13.0823 3.48045 13.2682 3.61449 13.3687 3.8075C13.3878 3.84416 13.4071 3.89529 13.4906 4.14601L13.5821 4.42031L13.6176 4.52421C13.6535 4.62372 13.6954 4.71994 13.7426 4.81254H8.25739Z"
            />
            <path d="M5.42208 7.74597C5.39683 7.36711 5.06923 7.08047 4.69038 7.10572C4.31152 7.13098 4.02487 7.45858 4.05013 7.83743L4.47496 14.2099C4.55333 15.3857 4.61663 16.3355 4.76511 17.0808C4.91947 17.8557 5.18203 18.5029 5.72432 19.0103C6.26662 19.5176 6.92987 19.7365 7.7133 19.839C8.46682 19.9376 9.41871 19.9376 10.5971 19.9375H11.4028C12.5812 19.9376 13.5332 19.9376 14.2867 19.839C15.0701 19.7365 15.7334 19.5176 16.2757 19.0103C16.818 18.5029 17.0805 17.8557 17.2349 17.0808C17.3834 16.3355 17.4467 15.3857 17.525 14.2099L17.9499 7.83743C17.9751 7.45858 17.6885 7.13098 17.3096 7.10572C16.9308 7.08047 16.6032 7.36711 16.5779 7.74597L16.1563 14.0702C16.0739 15.3057 16.0152 16.1654 15.8864 16.8122C15.7614 17.4396 15.5869 17.7717 15.3363 18.0062C15.0857 18.2406 14.7427 18.3926 14.1084 18.4756C13.4544 18.5612 12.5927 18.5625 11.3545 18.5625H10.6455C9.40727 18.5625 8.54559 18.5612 7.89164 18.4756C7.25731 18.3926 6.91433 18.2406 6.6637 18.0062C6.41307 17.7717 6.2386 17.4396 6.11361 16.8122C5.98476 16.1654 5.92607 15.3057 5.8437 14.0702L5.42208 7.74597Z" />
            <path d="M8.63993 9.39928C9.01774 9.3615 9.35464 9.63715 9.39242 10.015L9.85076 14.5983C9.88854 14.9761 9.61289 15.313 9.23508 15.3508C8.85727 15.3886 8.52036 15.1129 8.48258 14.7351L8.02425 10.1518C7.98647 9.77397 8.26212 9.43706 8.63993 9.39928Z" />
            <path d="M13.3601 9.39928C13.7379 9.43706 14.0135 9.77397 13.9758 10.1518L13.5174 14.7351C13.4796 15.1129 13.1427 15.3886 12.7649 15.3508C12.3871 15.313 12.1115 14.9761 12.1492 14.5983L12.6076 10.015C12.6454 9.63715 12.9823 9.3615 13.3601 9.39928Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SingleItem;
