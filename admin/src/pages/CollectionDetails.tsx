import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { collectionApi, type CollectionRecord } from "../api/collectionApi";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon, PencilIcon } from "../icons";
import { showError } from "../utils/toast";

function formatDateTime(value?: string) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CollectionDetails() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!collectionId) {
      setIsLoading(false);
      return;
    }

    const loadCollection = async () => {
      try {
        setIsLoading(true);
        const response = await collectionApi.getById(collectionId);
        setCollection(response.result);
      } catch (error) {
        console.error("Failed to load collection", error);
        showError("Không thể tải thông tin bộ sưu tập.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCollection();
  }, [collectionId]);

  if (isLoading) {
    return (
      <>
        <PageMeta title="Chi tiết bộ sưu tập | Hệ thống Admin" description="Xem chi tiết bộ sưu tập" />
        <PageBreadcrumb pageTitle="Chi tiết bộ sưu tập" />
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải chi tiết bộ sưu tập...</span>
          </div>
        </div>
      </>
    );
  }

  if (!collection) {
    return (
      <>
        <PageMeta title="Không tìm thấy bộ sưu tập | Hệ thống Admin" description="Không tìm thấy bộ sưu tập yêu cầu" />
        <PageBreadcrumb pageTitle="Chi tiết bộ sưu tập" />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy bộ sưu tập cần xem.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/collections")}>
            Quay lại danh sách bộ sưu tập
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`${collection.name} | Hệ thống Admin`} description="Xem chi tiết bộ sưu tập" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={`Chi tiết ${collection.name}`} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" startIcon={<PencilIcon />} onClick={() => navigate(`/collections/${collection.id}/edit`)}>
            Chỉnh sửa
          </Button>
          <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/collections")}>
            Danh sách bộ sưu tập
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Bộ sưu tập</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{collection.name}</h3>
            <Badge size="sm" color={collection.status === false ? "light" : "success"} variant="light">
              {collection.status === false ? "Tạm ẩn" : "Đang hiển thị"}
            </Badge>
          </div>
          <p className="mt-2 font-mono text-sm text-gray-500 dark:text-gray-400">{collection.slug}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ảnh cover</h4>
              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]">
                {collection.coverMediaUrl ? (
                  <img src={collection.coverMediaUrl} alt={collection.name} className="h-72 w-full object-cover" />
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-gray-400">
                    Bộ sưu tập chưa có ảnh cover
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Liên kết và SEO</h4>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p><span className="font-medium text-gray-900 dark:text-white">SEO title:</span> {collection.seoTitle || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">SEO description:</span> {collection.seoDescription || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Canonical:</span> {collection.canonicalUrl || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Source URL:</span> {collection.sourceUrl || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Loại media:</span> {collection.coverMediaType || "Chưa có"}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Tạo lúc:</span> {formatDateTime(collection.createdAt)}</p>
                <p><span className="font-medium text-gray-900 dark:text-white">Cập nhật:</span> {formatDateTime(collection.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Tóm tắt</h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Thứ tự</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{(collection.sortOrder || 0).toLocaleString("vi-VN")}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sản phẩm liên kết</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{(collection.linkedProductCount || 0).toLocaleString("vi-VN")}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Số sản phẩm hiển thị</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{(collection.productCount || 0).toLocaleString("vi-VN")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Sản phẩm trong bộ sưu tập</h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Danh sách sản phẩm đang được gắn vào bộ sưu tập này.
                  </p>
                </div>
                <Badge size="sm" color="info" variant="light">
                  {(collection.products?.length || 0).toLocaleString("vi-VN")} sản phẩm
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {collection.products?.length ? (
                  collection.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.02]"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-400">Không ảnh</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                        <p className="mt-1 truncate font-mono text-xs text-gray-500 dark:text-gray-400">{product.slug}</p>
                      </div>
                      <Badge size="sm" color={product.status === "ACTIVE" ? "success" : "light"} variant="light">
                        {product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-white/[0.08]">
                    Bộ sưu tập này chưa liên kết sản phẩm nào.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
