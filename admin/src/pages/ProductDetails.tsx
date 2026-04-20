import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { productApi } from "../api/productApi";
import type { ProductFormProduct } from "../components/products/ProductModal";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon, PencilIcon } from "../icons";
import { showError } from "../utils/toast";

const formatCurrency = (value?: number) => `${(value || 0).toLocaleString("vi-VN")} đ`;

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductFormProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const loadProduct = async () => {
      try {
        setIsLoading(true);
        const response = await productApi.getById(productId);
        setProduct(response.result);
      } catch (error) {
        console.error("Failed to load product", error);
        showError("Không thể tải thông tin sản phẩm.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <>
        <PageMeta title="Chi tiết sản phẩm | Hệ thống Admin" description="Xem chi tiết sản phẩm" />
        <PageBreadcrumb pageTitle="Chi tiết sản phẩm" />
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải chi tiết sản phẩm...</span>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <PageMeta title="Không tìm thấy sản phẩm | Hệ thống Admin" description="Không tìm thấy sản phẩm yêu cầu" />
        <PageBreadcrumb pageTitle="Chi tiết sản phẩm" />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy sản phẩm cần xem.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/products")}>
            Quay lại danh sách sản phẩm
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`${product.name} | Hệ thống Admin`} description="Xem chi tiết sản phẩm" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={`Chi tiết ${product.name}`} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" startIcon={<PencilIcon />} onClick={() => navigate(`/products/${product.id}/edit`)}>
            Chỉnh sửa
          </Button>
          <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/products")}>
            Danh sách sản phẩm
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Sản phẩm</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{product.name}</h3>
            <Badge size="sm" color={product.status === "ACTIVE" ? "success" : "light"} variant="light">
              {product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
            </Badge>
          </div>
          <p className="mt-2 font-mono text-sm text-gray-500 dark:text-gray-400">{product.slug}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Thông tin cơ bản</h4>
              <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p><span className="font-medium text-gray-900 dark:text-white">Danh mục:</span> {product.category?.name || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Giới tính:</span> {product.gender || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Kiểu dáng:</span> {product.style || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Chất liệu:</span> {product.material || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Mô tả ngắn:</span> {product.shortDescription || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Mô tả:</span> {product.description || "Chưa có"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05]">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Màu sắc và biến thể</h4>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {product.colors?.length ? product.colors.map((color) => (
                  <div key={color.id || color.colorName} className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded-full border border-gray-200" style={{ backgroundColor: color.hexCode || "#d1d5db" }} />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{color.colorName || "Màu chưa đặt tên"}</p>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {color.variants?.map((variant) => (
                        <div key={variant.id || `${color.colorName}-${variant.sizeName}`} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Size {variant.sizeName || "--"}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Giá gốc: {formatCurrency(variant.originalPrice)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Giá bán: {formatCurrency(variant.salePrice)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tồn kho: {(variant.stockQuantity || 0).toLocaleString("vi-VN")}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-8 text-sm text-gray-400">Chưa có biến thể.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Tags</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.tags?.length ? product.tags.map((tag) => (
                  <Badge key={typeof tag === "string" ? tag : tag.id} size="sm" color="info" variant="light">
                    {typeof tag === "string" ? tag : tag.name || tag.slug}
                  </Badge>
                )) : (
                  <span className="text-sm text-gray-400">Chưa có tag</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Hình ảnh</h4>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {product.colors?.flatMap((color) => color.images?.map((image) => image.url) || color.imageUrls || []).filter(Boolean).slice(0, 8).map((imageUrl) => (
                  <div key={imageUrl} className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]">
                    <img src={imageUrl} alt={product.name} className="h-40 w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
