"use client";

import React, { useEffect, useState } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import Image from "next/image";
import Newsletter from "../Common/Newsletter";
import RecentlyViewdItems from "./RecentlyViewd";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { buildCartItemFromProduct, Product } from "@/types/product";
import { getProductBySlug } from "@/libs/catalog-api";
import SectionLoader from "../Common/SectionLoader";
import { syncAddCartItem } from "@/libs/cart-sync";
import { reviewApi, ProductReview, ProductReviewSummary } from "@/libs/review-api";

type ShopDetailsProps = {
  slug: string;
};

const ShopDetails = ({ slug }: ShopDetailsProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [product, setProduct] = useState<Product | null>(null);
  const [previewImg, setPreviewImg] = useState(0);
  const [activeColor, setActiveColor] = useState("");
  const [activeSize, setActiveSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary | null>(null);

  const getFirstAvailableSize = (colors: Product["colors"], preferredColorName?: string) => {
    const targetColor =
      colors.find((color) => color.name === preferredColorName) || colors[0];

    return (
      targetColor?.variants.find((variant) => variant.stockQuantity > 0)?.sizeName ||
      ""
    );
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError("");
        const productData = await getProductBySlug(slug);
        const initialColor =
          productData.colors.find((color) =>
            color.variants.some((variant) => variant.stockQuantity > 0)
          ) || productData.colors[0];

        setProduct(productData);
        setActiveColor(initialColor?.name || "");
        setActiveSize(getFirstAvailableSize(productData.colors, initialColor?.name));
        setPreviewImg(0);
        const [reviewsResponse, summaryResponse] = await Promise.all([
          reviewApi.getByProduct(productData.id).catch(() => null),
          reviewApi.getSummary(productData.id).catch(() => null),
        ]);
        setReviews(reviewsResponse?.result?.data || []);
        setReviewSummary(summaryResponse?.result || null);
      } catch (loadError) {
        console.error(loadError);
        setError("Không tải được chi tiết sản phẩm.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const selectedColor =
    product?.colors.find((color) => color.name === activeColor) || product?.colors[0];
  const selectedSizes = selectedColor?.sizes.length
    ? selectedColor.sizes
    : product?.sizes || [];
  const selectedVariants = selectedColor?.variants || [];
  const selectedVariant =
    selectedVariants.find((variant) => variant.sizeName === activeSize) ||
    null;
  const imageList =
    selectedColor?.images.length ? selectedColor.images : product?.imgs.previews || [];
  const activeImage = imageList[previewImg] || product?.imgs.previews[0] || "";
  const isSelectedVariantOutOfStock =
    Boolean(selectedVariant) && selectedVariant.stockQuantity <= 0;
  const isAddToCartDisabled = !product?.inStock || isSelectedVariantOutOfStock;
  const displayPrice =
    selectedVariant?.salePrice || selectedVariant?.originalPrice || product?.discountedPrice || 0;
  const displayOriginalPrice =
    selectedVariant?.originalPrice || selectedVariant?.salePrice || product?.price || 0;
  const materialParts = (product?.material || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  const handleAddToCart = () => {
    if (!product || isAddToCartDisabled) return;
    syncAddCartItem(
      buildCartItemFromProduct(product, {
        colorId: selectedColor?.id,
        sizeName: activeSize,
        quantity,
      })
    ).catch((error) => {
      console.error("Không thể thêm vào giỏ hàng", error);
    });
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    dispatch(
      addItemToWishlist({
        ...product,
        quantity: 1,
        status: product.inStock ? "available" : "unavailable",
      })
    );
  };

  if (isLoading) {
    return (
      <>
        <Breadcrumb title={"Chi tiết sản phẩm"} pages={["chi tiết sản phẩm"]} />
        <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <SectionLoader title="Đang tải chi tiết sản phẩm" columns={2} rows={1} />
          </div>
        </section>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Breadcrumb title={"Chi tiết sản phẩm"} pages={["chi tiết sản phẩm"]} />
        <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="rounded-2xl border border-dashed border-gray-3 bg-white px-6 py-10 text-center text-dark">
              {error || "Không tìm thấy sản phẩm."}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        title={product.title}
        pages={[product.categoryName, "/", product.title]}
      />

      <section className="overflow-hidden relative pb-20 pt-5 lg:pt-20 xl:pt-28">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
            <div className="lg:max-w-[570px] w-full flex gap-4">
              <div className="app-scrollbar flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[512px]">
                {imageList.map((item, key) => (
                  <button
                    onClick={() => setPreviewImg(key)}
                    key={`${item}-${key}`}
                    className={`flex-shrink-0 w-20 h-20 overflow-hidden rounded-lg bg-gray-2 shadow-1 ease-out duration-200 border-2 ${
                      key === previewImg
                        ? "border-[#FCAF17]"
                        : "border-transparent hover:border-[#FCAF17]"
                    }`}
                  >
                    <Image
                      width={80}
                      height={80}
                      src={item}
                      alt={product.title}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>

              <div className="flex-1 h-[512px] relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-1">
                <Image
                  src={activeImage}
                  alt={product.title}
                  width={600}
                  height={700}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
            </div>

            <div className="max-w-[539px] w-full">
              <div className="mb-3">
                <span className="inline-flex rounded-full bg-blue/15 px-3 py-1 text-sm font-medium text-dark">
                  {product.categoryName}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-xl sm:text-2xl xl:text-custom-3 text-dark">
                  {product.title}
                </h2>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-5.5">
                <div className="flex items-center gap-1.5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#22AD5C" strokeWidth="1.5" />
                    <path d="M6.5 10.3L8.9 12.7L13.7 7.9" stroke="#22AD5C" strokeWidth="1.5" />
                  </svg>
                  <span className={product.inStock ? "text-green" : "text-red"}>
                    {product.inStock ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>

                <span className="text-dark-4">
                  Tồn kho: {product.totalStock.toLocaleString("vi-VN")}
                </span>
                <span className="text-dark-4">
                  {reviewSummary?.reviewCount
                    ? `${(reviewSummary.averageRating || 0).toFixed(1)}/5 từ ${reviewSummary.reviewCount} đánh giá`
                    : "Chưa có đánh giá"}
                </span>
              </div>

              <h3 className="font-medium text-custom-1 mb-4.5 flex items-end gap-3">
                <span className="text-heading-4 text-dark font-bold">
                  {displayPrice.toLocaleString("vi-VN")}đ
                </span>
                {displayOriginalPrice > displayPrice && (
                  <span className="line-through text-dark-4 text-xl">
                    {displayOriginalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
              </h3>

              <p className="mb-8 text-dark-4 leading-7">
                {product.shortDescription || product.description || "Sản phẩm đang được cập nhật mô tả chi tiết."}
              </p>

              {product.colors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-dark mb-3">Màu sắc: {activeColor}</h4>
                  <div className="flex items-center gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setActiveColor(color.name);
                          setActiveSize(getFirstAvailableSize(product.colors, color.name));
                          setPreviewImg(0);
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          activeColor === color.name ? "border-blue" : "border-transparent"
                        }`}
                        title={color.name}
                      >
                        <span
                          className="block h-6 w-6 rounded-full border border-gray-3"
                          style={{ backgroundColor: color.hexCode }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedSizes.length > 0 && (
                <div className="mb-8">
                  <div className="mb-3">
                    <h4 className="font-medium text-dark">
                      Kích thước: {activeSize || "Chưa chọn"}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {(selectedVariants.length > 0
                      ? selectedVariants
                      : selectedSizes.map((size) => ({
                          id: size,
                          sizeName: size,
                          stockQuantity: product.inStock ? 1 : 0,
                        }))).map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={variant.stockQuantity <= 0}
                        onClick={() => setActiveSize(variant.sizeName)}
                        className={`relative h-12 w-12 rounded-full border flex items-center justify-center text-sm font-medium transition-all ${
                          activeSize === variant.sizeName
                            ? "border-yellow text-yellow"
                            : "border-gray-3 text-dark hover:border-dark"
                        } ${
                          variant.stockQuantity <= 0
                            ? "cursor-not-allowed text-dark-4 hover:border-gray-3"
                            : ""
                        }`}
                      >
                        {variant.sizeName}
                        {variant.stockQuantity <= 0 && (
                          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                            <span className="absolute left-1/2 top-1/2 h-[1.5px] w-[135%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gray-4" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8 rounded-2xl bg-gray-1 p-4">
                <h4 className="mb-2 font-medium text-dark">Chất liệu</h4>
                {materialParts.length > 0 ? (
                  <ul className="space-y-1.5 text-sm leading-6 text-dark-4">
                    {materialParts.map((part) => (
                      <li key={part}>{part}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-dark-4">Chất liệu đang cập nhật</p>
                )}
              </div>

              <div className="mb-8 flex items-center gap-4">
                <div className="flex items-center border border-gray-3 rounded-full h-11 px-1">
                  <button
                    type="button"
                    className="w-8 h-full flex items-center justify-center text-dark hover:text-blue"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  >
                    <svg width="14" height="2" viewBox="0 0 14 2" fill="none">
                      <path d="M0 1H14" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                  <span className="w-10 text-center font-medium text-dark">{quantity}</span>
                  <button
                    type="button"
                    className="w-8 h-full flex items-center justify-center text-dark hover:text-blue"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 0V14M0 7H14" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddToCartDisabled}
                  className={`flex-1 max-w-[260px] h-11 text-dark font-bold rounded-full flex items-center justify-center gap-2 transition-colors ${
                    isAddToCartDisabled
                      ? "cursor-not-allowed bg-gray-3 text-dark-4"
                      : "bg-[#FCAF17] hover:bg-[#e09b15]"
                  }`}
                >
                  {isAddToCartDisabled ? "Hết hàng" : "Thêm vào giỏ"}
                </button>

                <button
                  type="button"
                  onClick={handleAddToWishlist}
                  className="h-11 rounded-full border border-gray-3 px-5 font-medium text-dark transition-colors hover:border-blue hover:text-blue"
                >
                  Yêu thích
                </button>
              </div>

              <div className="rounded-2xl bg-gray-1 p-5">
                <h4 className="mb-3 font-medium text-dark">Thông tin nhanh</h4>
                <ul className="space-y-2 text-dark-4">
                  <li>Danh mục: {product.categoryName}</li>
                  <li>Kích thước hiện có: {product.sizes.join(", ") || "Đang cập nhật"}</li>
                  <li>Chất liệu: {product.material || "Đang cập nhật"}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-[18px] border border-gray-3 bg-white p-5 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-3 pb-5">
              <div>
                <h3 className="text-2xl font-semibold text-dark">Đánh giá sản phẩm</h3>
                <p className="mt-1 text-sm text-dark-4">
                  {reviewSummary?.reviewCount
                    ? `${reviewSummary.reviewCount} đánh giá đã xác thực`
                    : "Sản phẩm chưa có đánh giá từ khách đã mua."}
                </p>
              </div>
              {reviewSummary?.reviewCount ? (
                <div className="rounded-full bg-[#FFF3D7] px-4 py-2 font-semibold text-dark">
                  {(reviewSummary.averageRating || 0).toFixed(1)}/5
                </div>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="rounded-[16px] border border-gray-3 bg-gray-1 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-dark">{review.userName || "Khách hàng"}</p>
                      <p className="text-sm font-medium text-[#C98700]">
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </p>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm leading-6 text-dark-4">{review.comment}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-[16px] border border-dashed border-gray-3 px-4 py-8 text-center text-dark-4">
                  Hãy là người đầu tiên đánh giá sau khi nhận hàng.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <RecentlyViewdItems
        currentProductId={product.id}
        categorySlug={product.categorySlug}
      />

      <Newsletter />
    </>
  );
};

export default ShopDetails;
