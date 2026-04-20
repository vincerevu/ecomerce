import { useEffect, useMemo, useState } from "react";
import { type CollectionPayload, type CollectionRecord } from "../../api/collectionApi";
import { productApi } from "../../api/productApi";
import ImageUpload from "../common/ImageUpload";
import Select from "../form/Select";
import { getPrimaryImageUrl, type ProductRow } from "../tables/productTable.utils";
import { showError } from "../../utils/toast";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CollectionPayload) => void;
  collection?: CollectionRecord | null;
  embedded?: boolean;
}

type Tab = "info" | "products";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export default function CollectionModal({
  isOpen,
  onClose,
  onSave,
  collection,
  embedded = false,
}: CollectionModalProps) {
  const isEdit = Boolean(collection);
  const [tab, setTab] = useState<Tab>("info");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [coverMediaUrl, setCoverMediaUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadProducts = async () => {
      try {
        const response = await productApi.getAll<ProductRow>({
          page: 0,
          size: 300,
          sort: "createdAt,desc",
        });

        if (response.code === 1000) {
          setProducts(response.result.data || []);
        }
      } catch (error) {
        console.error("Failed to load products for collection editor", error);
        showError("Không thể tải danh sách sản phẩm.");
      }
    };

    void loadProducts();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setTab("info");

    if (collection) {
      setName(collection.name || "");
      setSlug(collection.slug || "");
      setSlugManual(true);
      setSeoTitle(collection.seoTitle || "");
      setSeoDescription(collection.seoDescription || "");
      setCanonicalUrl(collection.canonicalUrl || "");
      setSourceUrl(collection.sourceUrl || "");
      setCoverMediaUrl(collection.coverMediaUrl || "");
      setSortOrder(collection.sortOrder || 0);
      setProductCount(collection.productCount || collection.linkedProductCount || 0);
      setStatus(collection.status === false ? "INACTIVE" : "ACTIVE");
      setSelectedProductIds(collection.products?.map((product) => product.id) || []);
    } else {
      setName("");
      setSlug("");
      setSlugManual(false);
      setSeoTitle("");
      setSeoDescription("");
      setCanonicalUrl("");
      setSourceUrl("");
      setCoverMediaUrl("");
      setSortOrder(0);
      setProductCount(0);
      setStatus("ACTIVE");
      setSelectedProductIds([]);
    }

    setProductSearch("");
  }, [collection, isOpen]);

  useEffect(() => {
    if (!slugManual && name) {
      setSlug(slugify(name));
    }
  }, [name, slugManual]);

  const filteredProducts = useMemo(() => {
    const normalized = productSearch.trim().toLowerCase();
    if (!normalized) return products;

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(normalized) ||
        product.slug.toLowerCase().includes(normalized),
    );
  }, [productSearch, products]);

  const selectedCount = selectedProductIds.length;

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const handleSave = () => {
    if (!name.trim() || !slug.trim()) {
      showError("Vui lòng nhập tên và slug cho bộ sưu tập.");
      return;
    }

    onSave({
      name: name.trim(),
      slug: slug.trim(),
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      coverMediaUrl: coverMediaUrl.trim() || undefined,
      sortOrder: Number(sortOrder) || 0,
      productCount: Number(productCount) || selectedCount,
      status: status === "ACTIVE",
      productIds: selectedProductIds,
    });
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <div
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 ${
        embedded ? "border border-gray-200 dark:border-white/[0.06]" : "max-w-5xl"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isEdit ? "Sửa bộ sưu tập" : "Thêm bộ sưu tập mới"}
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {isEdit ? collection?.id : "Thiết lập metadata và liên kết sản phẩm cho bộ sưu tập"}
          </p>
        </div>
        {!embedded ? (
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="flex gap-1 border-b border-gray-100 px-6 dark:border-white/[0.06]">
        {(["info", "products"] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === item
                ? "border-violet-600 text-violet-700 dark:text-violet-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {item === "info" ? "Thông tin chung" : `Sản phẩm liên kết (${selectedCount})`}
          </button>
        ))}
      </div>

      <div className={`${embedded ? "p-6" : "max-h-[80vh] overflow-y-auto p-6"}`}>
        {tab === "info" ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Tên bộ sưu tập *</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ví dụ: Hè năng động"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Slug *</label>
                  <input
                    value={slug}
                    onChange={(event) => {
                      setSlug(event.target.value);
                      setSlugManual(true);
                    }}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">SEO title</label>
                  <input
                    value={seoTitle}
                    onChange={(event) => setSeoTitle(event.target.value)}
                    placeholder="Tiêu đề SEO"
                    className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Trạng thái</label>
                  <Select
                    value={status}
                    onChange={(value) => setStatus(value as "ACTIVE" | "INACTIVE")}
                    options={[
                      { value: "ACTIVE", label: "Đang hiển thị" },
                      { value: "INACTIVE", label: "Tạm ẩn" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">SEO description</label>
                <textarea
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Canonical URL</label>
                  <input
                    value={canonicalUrl}
                    onChange={(event) => setCanonicalUrl(event.target.value)}
                    placeholder="https://..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Source URL</label>
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://..."
                    className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(Number(event.target.value))}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Số sản phẩm hiển thị</label>
                  <input
                    type="number"
                    value={productCount}
                    onChange={(event) => setProductCount(Number(event.target.value))}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Ảnh cover</label>
                <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex justify-center">
                    <ImageUpload
                      value={coverMediaUrl}
                      onChange={setCoverMediaUrl}
                      className="h-32 w-32"
                      folder="ecommerce/collections"
                    />
                  </div>
                  <input
                    value={coverMediaUrl}
                    onChange={(event) => setCoverMediaUrl(event.target.value)}
                    placeholder="https://..."
                    className="mt-4 h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tóm tắt</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>
                    <span className="font-medium text-gray-900 dark:text-white">Slug:</span> {slug || "Chưa có"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900 dark:text-white">Đang liên kết:</span> {selectedCount} sản phẩm
                  </p>
                  <p>
                    <span className="font-medium text-gray-900 dark:text-white">Trạng thái:</span>{" "}
                    {status === "ACTIVE" ? "Đang hiển thị" : "Tạm ẩn"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/[0.06] dark:bg-[#111b2d]">
              <input
                type="text"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Tìm theo tên hoặc slug sản phẩm..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const selected = selectedProductIds.includes(product.id);
                const thumb = getPrimaryImageUrl(product);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleToggleProduct(product.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-violet-400 bg-violet-50/70 shadow-sm dark:border-violet-400/60 dark:bg-violet-500/10"
                        : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/30 dark:border-white/[0.06] dark:bg-[#111b2d]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]">
                        {thumb ? (
                          <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-gray-400">Không ảnh</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                        <p className="mt-1 truncate font-mono text-xs text-gray-500 dark:text-gray-400">{product.slug}</p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {product.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                        </p>
                      </div>
                      <div
                        className={`mt-1 h-5 w-5 rounded-full border ${
                          selected ? "border-violet-500 bg-violet-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800">
          Hủy
        </button>
        {tab !== "products" ? (
          <button
            onClick={() => setTab("products")}
            className="rounded-lg border border-violet-300 px-5 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
          >
            Chọn sản phẩm
          </button>
        ) : null}
        <button
          onClick={handleSave}
          className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 dark:shadow-none"
        >
          {isEdit ? "Lưu thay đổi" : "Tạo bộ sưu tập"}
        </button>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />
      {content}
    </div>
  );
}
