"use client";

import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import ProductItem from "../Common/ProductItem";
import SingleListItem from "../Shop/SingleListItem";
import { Category } from "@/types/category";
import { Product } from "@/types/product";
import { getProducts, getCategories } from "@/libs/catalog-api";
import { getCollectionProducts } from "@/libs/collection-api";
import SectionLoader from "../Common/SectionLoader";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomDropdown from "../Common/CustomDropdown";
import { PAGE_SIZE_OPTIONS, useStoredPageSize } from "@/hooks/useStoredPageSize";

const DEFAULT_PAGE_SIZE = 12;

const PRICE_SORT_OPTIONS = [
  { label: "Giá mặc định", value: "" },
  { label: "Giá cao đến thấp", value: "price-desc" },
  { label: "Giá thấp đến cao", value: "price-asc" },
];

type DrawerSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

type FilterDraft = {
  category: string;
  colors: string[];
  sizes: string[];
  minPrice: string;
  maxPrice: string;
};

type CatalogParams = {
  q: string;
  collection: string;
  category: string;
  colors: string[];
  sizes: string[];
  minPrice: string;
  maxPrice: string;
  sort: string;
  page: number;
};

const DrawerSection = ({
  title,
  isOpen,
  onToggle,
  children,
}: DrawerSectionProps) => (
  <div className="border-b border-dashed border-gray-3 py-5">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 text-left text-[28px] font-medium tracking-[-0.02em] text-dark md:text-[32px]"
    >
      <span className="text-[18px] font-medium md:text-[20px]">{title}</span>
      <span className="text-dark-4 transition-transform duration-200">
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M4.16675 10H15.8334"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 4.16666V15.8333M4.16675 10H15.8334"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </button>

    {isOpen ? <div className="pt-4">{children}</div> : null}
  </div>
);

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

const escapeFilterValue = (value: string) => value.replace(/'/g, "\\'");

const splitParam = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const buildClause = (field: string, values: string[]) => {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return `${field}:'${escapeFilterValue(values[0])}'`;
  }

  return `(${values
    .map((value) => `${field}:'${escapeFilterValue(value)}'`)
    .join(" or ")})`;
};

const buildFilter = ({
  category,
  colors,
  sizes,
  minPrice,
  maxPrice,
}: Omit<CatalogParams, "q" | "sort" | "page">) => {
  const parts = [
    category ? `category.slug:'${escapeFilterValue(category)}'` : "",
    buildClause("colors.colorName", colors),
    buildClause("colors.variants.sizeName", sizes),
    minPrice ? `colors.variants.salePrice>=${Number(minPrice)}` : "",
    maxPrice ? `colors.variants.salePrice<=${Number(maxPrice)}` : "",
  ].filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return parts.map((part) => `(${part})`).join(" and ");
};

const getCatalogParams = (searchParams: ReturnType<typeof useSearchParams>): CatalogParams => {
  const pageValue = Number(searchParams.get("page") || "1");

  return {
    q: searchParams.get("q")?.trim() || "",
    collection: searchParams.get("collection") || "",
    category: searchParams.get("category") || "",
    colors: splitParam(searchParams.get("colors")),
    sizes: splitParam(searchParams.get("sizes")),
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
};

const mapServerSort = (sort: string) => {
  switch (sort) {
    case "name-asc":
      return "name,asc";
    case "name-desc":
      return "name,desc";
    case "newest":
    default:
      return "createdAt,desc";
  }
};

const sortCurrentPageItems = (items: Product[], sort: string) => {
  const nextItems = [...items];

  nextItems.sort((left, right) => {
    switch (sort) {
      case "discount":
        return (
          (right.price - right.discountedPrice) / Math.max(right.price, 1) -
          (left.price - left.discountedPrice) / Math.max(left.price, 1)
        );
      case "price-asc":
        return left.discountedPrice - right.discountedPrice;
      case "price-desc":
        return right.discountedPrice - left.discountedPrice;
      case "name-asc":
        return left.title.localeCompare(right.title, "vi");
      case "name-desc":
        return right.title.localeCompare(left.title, "vi");
      case "newest":
      default:
        return (
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
        );
    }
  });

  return nextItems;
};

const buildUpdatedSearch = (
  currentParams: URLSearchParams,
  updates: Record<string, string | undefined>
) => {
  const nextParams = new URLSearchParams(currentParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (!value) {
      nextParams.delete(key);
      return;
    }

    nextParams.set(key, value);
  });

  return nextParams.toString();
};

const getPaginationItems = (currentPage: number, totalPages: number) => {
  if (totalPages <= 10) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  const addPage = (page: number) => {
    if (!pages.includes(page)) {
      pages.push(page);
    }
  };

  for (let i = 1; i <= 4; i++) {
    addPage(i);
  }

  if (currentPage <= 6) {
    for (let i = 5; i <= Math.max(6, currentPage + 1); i++) {
      addPage(i);
    }
    pages.push("...");
  } else if (currentPage >= totalPages - 5) {
    pages.push("...");
    for (let i = Math.min(totalPages - 5, currentPage - 1); i <= totalPages - 4; i++) {
      addPage(i);
    }
  } else {
    pages.push("...");
    addPage(currentPage - 1);
    addPage(currentPage);
    addPage(currentPage + 1);
    pages.push("...");
  }

  for (let i = totalPages - 3; i <= totalPages; i++) {
    addPage(i);
  }

  return pages;
};

const ShopWithSidebar = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const catalogParams = useMemo(() => getCatalogParams(searchParams), [searchParams]);
  const [pageSize, setPageSize] = useStoredPageSize("client.shopWithSidebar.pageSize", DEFAULT_PAGE_SIZE);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productStyle, setProductStyle] = useState("grid");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [draftFilters, setDraftFilters] = useState<FilterDraft>({
    category: "",
    colors: [],
    sizes: [],
    minPrice: "",
    maxPrice: "",
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    color: true,
    price: true,
    size: true,
  });

  useEffect(() => {
    setDraftFilters({
      category: catalogParams.category,
      colors: catalogParams.colors,
      sizes: catalogParams.sizes,
      minPrice: catalogParams.minPrice,
      maxPrice: catalogParams.maxPrice,
    });
  }, [catalogParams]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryData = await getCategories();
        setCategories(categoryData);
      } catch (loadError) {
        console.error(loadError);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoading(true);
        setError("");

        const finalResponse = catalogParams.collection
          ? await getCollectionProducts({
              slug: catalogParams.collection,
              page: catalogParams.page - 1,
              size: pageSize,
            })
          : await getProducts({
              page: catalogParams.page - 1,
              size: pageSize,
              sort: mapServerSort(catalogParams.sort),
              filter: buildFilter(catalogParams),
              q: catalogParams.q || undefined,
            });

        setProducts(sortCurrentPageItems(finalResponse.items, catalogParams.sort));
        setTotalPages(Math.max(finalResponse.totalPages, 1));
        setTotalElements(finalResponse.totalElements);
      } catch (loadError) {
        console.error(loadError);
        setError("Không tải được danh sách sản phẩm.");
        setProducts([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadCatalog();
  }, [catalogParams, pageSize]);

  useEffect(() => {
    if (!isFilterDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFilterDrawerOpen]);

  const availableColors = useMemo(
    () =>
      Array.from(
        new Set(products.flatMap((product) => product.colors.map((color) => color.name)))
      ),
    [products]
  );

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();

    products.forEach((product) => {
      product.colors.forEach((color) => {
        if (!map.has(color.name)) {
          map.set(color.name, color.hexCode);
        }
      });
    });

    return map;
  }, [products]);

  const availableSizes = useMemo(
    () => Array.from(new Set(products.flatMap((product) => product.sizes))),
    [products]
  );

  const activeFilterCount =
    (catalogParams.category ? 1 : 0) +
    catalogParams.colors.length +
    catalogParams.sizes.length +
    (catalogParams.minPrice ? 1 : 0) +
    (catalogParams.maxPrice ? 1 : 0);

  const updateRoute = (updates: Record<string, string | undefined>) => {
    const nextSearch = buildUpdatedSearch(new URLSearchParams(searchParams.toString()), updates);
    router.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  };

  const handlePageSizeChange = (nextValue: string) => {
    setPageSize(Number(nextValue));
    updateRoute({ page: undefined });
  };

  const toggleSection = (section: string) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const toggleDraftArrayValue = (key: "colors" | "sizes", value: string) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const applyFilters = () => {
    updateRoute({
      category: draftFilters.category || undefined,
      colors: draftFilters.colors.length ? draftFilters.colors.join(",") : undefined,
      sizes: draftFilters.sizes.length ? draftFilters.sizes.join(",") : undefined,
      minPrice: draftFilters.minPrice || undefined,
      maxPrice: draftFilters.maxPrice || undefined,
      page: undefined,
    });
    setIsFilterDrawerOpen(false);
  };

  const resetFilters = () => {
    updateRoute({
      category: undefined,
      colors: undefined,
      sizes: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: undefined,
      page: undefined,
      q: undefined,
    });
  };

  const closeDrawer = () => setIsFilterDrawerOpen(false);

  return (
    <>
      <Breadcrumb
        title={"Khám phá tất cả sản phẩm"}
        pages={["Cửa hàng", "/", "Trang sản phẩm"]}
        compact
      />

      <section className="relative overflow-hidden bg-white pb-16 pt-2 lg:pt-4">
        <div className="mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-3 pb-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-base text-dark-5 lg:text-lg">
                  {catalogParams.q.trim() ? (
                    <>
                      Kết quả tìm kiếm{" "}
                      <span className="font-medium text-dark">"{catalogParams.q.trim()}"</span>
                    </>
                  ) : (
                    "Tất cả sản phẩm"
                  )}
                </p>
                <div className="inline-flex items-center rounded-full bg-gray-1 px-4 py-1.5 text-sm font-medium text-dark">
                  {isLoading ? "Đang tải..." : `${totalElements} sản phẩm`}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateRoute({ sort: "discount", page: undefined })}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    catalogParams.sort === "discount"
                      ? "border-yellow bg-yellow text-dark"
                      : "border-gray-3 bg-white text-dark hover:border-yellow hover:bg-yellow-light"
                  }`}
                >
                  Ưu đãi
                </button>
                <button
                  type="button"
                  onClick={() => updateRoute({ sort: "newest", page: undefined })}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    catalogParams.sort === "newest"
                      ? "border-yellow bg-yellow text-dark"
                      : "border-gray-3 bg-white text-dark hover:border-yellow hover:bg-yellow-light"
                  }`}
                >
                  Mới nhất
                </button>

                <CustomDropdown
                  value={
                    catalogParams.sort === "price-asc" || catalogParams.sort === "price-desc"
                      ? catalogParams.sort
                      : ""
                  }
                  onChange={(nextValue) =>
                    updateRoute({ sort: nextValue || "newest", page: undefined })
                  }
                  options={PRICE_SORT_OPTIONS}
                  className="min-w-[170px]"
                  buttonClassName="rounded-full border-gray-3 px-4 py-2 text-sm font-medium hover:border-yellow"
                  menuClassName="rounded-3xl p-2"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {catalogParams.category ? (
                <button
                  type="button"
                  onClick={() => updateRoute({ category: undefined, page: undefined })}
                  className="rounded-full bg-yellow-light px-3.5 py-1.5 text-sm text-dark transition-colors hover:bg-yellow"
                >
                  {categories.find((category) => category.slug === catalogParams.category)?.name ||
                    "Danh mục"}
                </button>
              ) : null}

              {catalogParams.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    updateRoute({
                      colors:
                        catalogParams.colors.filter((item) => item !== color).join(",") ||
                        undefined,
                      page: undefined,
                    })
                  }
                  className="rounded-full bg-yellow-light px-3.5 py-1.5 text-sm text-dark transition-colors hover:bg-yellow"
                >
                  {color}
                </button>
              ))}

              {catalogParams.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    updateRoute({
                      sizes:
                        catalogParams.sizes.filter((item) => item !== size).join(",") ||
                        undefined,
                      page: undefined,
                    })
                  }
                  className="rounded-full bg-yellow-light px-3.5 py-1.5 text-sm text-dark transition-colors hover:bg-yellow"
                >
                  Size {size}
                </button>
              ))}

              {(catalogParams.minPrice || catalogParams.maxPrice) && (
                <button
                  type="button"
                  onClick={() =>
                    updateRoute({
                      minPrice: undefined,
                      maxPrice: undefined,
                      page: undefined,
                    })
                  }
                  className="rounded-full bg-yellow-light px-3.5 py-1.5 text-sm text-dark transition-colors hover:bg-yellow"
                >
                  {catalogParams.minPrice ? formatCurrency(Number(catalogParams.minPrice)) : "0đ"} -{" "}
                  {catalogParams.maxPrice
                    ? formatCurrency(Number(catalogParams.maxPrice))
                    : "Tối đa"}
                </button>
              )}

              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-gray-3 px-3.5 py-1.5 text-sm text-dark-4 transition-colors hover:border-yellow hover:bg-yellow-light hover:text-dark"
                >
                  Xóa lọc
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-gray-3 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setProductStyle("grid")}
                  aria-label="Hiển thị dạng lưới"
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
                    productStyle === "grid"
                      ? "bg-yellow text-dark"
                      : "text-dark-4 hover:bg-yellow-light hover:text-dark"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M2.25 2.25H7.25V7.25H2.25V2.25ZM10.75 2.25H15.75V7.25H10.75V2.25ZM2.25 10.75H7.25V15.75H2.25V10.75ZM10.75 10.75H15.75V15.75H10.75V10.75Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setProductStyle("list")}
                  aria-label="Hiển thị dạng danh sách"
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
                    productStyle === "list"
                      ? "bg-yellow text-dark"
                      : "text-dark-4 hover:bg-yellow-light hover:text-dark"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M3 4.5H15M3 9H15M3 13.5H15"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-3 bg-white px-3.5 py-2 text-sm font-medium text-dark transition-colors duration-200 hover:border-yellow hover:bg-yellow-light"
              >
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M3 4.5H15L10.2 9.9V13.8L7.8 15V9.9L3 4.5Z"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    strokeLinejoin="round"
                  />
                </svg>
                Lọc
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow px-1.5 text-[11px] font-semibold text-dark">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="pt-3">
            {isLoading ? (
              <SectionLoader title="Đang tải sản phẩm" columns={4} rows={2} />
            ) : error ? (
              <div className="rounded-[32px] border border-dashed border-gray-3 bg-white px-6 py-12 text-center text-dark">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-gray-3 bg-white px-6 py-12 text-center text-dark">
                Không có sản phẩm phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <>
                <div
                  className={
                    productStyle === "grid"
                      ? "grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "flex flex-col gap-6"
                  }
                >
                  {products.map((item) =>
                    productStyle === "grid" ? (
                      <ProductItem item={item} key={item.id} />
                    ) : (
                      <SingleListItem item={item} key={item.id} />
                    )
                  )}
                </div>

                <div className="mt-10 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-dark-4">
                    <span>Hiển thị</span>
                    <CustomDropdown
                      value={String(pageSize)}
                      onChange={handlePageSizeChange}
                      options={PAGE_SIZE_OPTIONS.map((option) => ({
                        label: `${option} sản phẩm`,
                        value: String(option),
                      }))}
                      className="min-w-[132px]"
                      buttonClassName="rounded-full border-gray-3 px-4 py-2 text-sm"
                      menuClassName="rounded-2xl p-2"
                      menuPlacement="top"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      disabled={catalogParams.page === 1}
                      onClick={() =>
                        updateRoute({
                          page:
                            catalogParams.page > 2
                              ? String(catalogParams.page - 1)
                              : undefined,
                        })
                      }
                      className="rounded-full border border-gray-3 bg-white px-4 py-2 text-sm text-dark disabled:opacity-45"
                    >
                      Trước
                    </button>

                    {getPaginationItems(catalogParams.page, totalPages).map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={item === "..."}
                        onClick={() => {
                          if (typeof item === "number") {
                            updateRoute({ page: item === 1 ? undefined : String(item) });
                          }
                        }}
                        className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                          item === "..."
                            ? "cursor-default"
                            : catalogParams.page === item
                            ? "bg-yellow text-dark"
                            : "border border-gray-3 bg-white text-dark hover:border-yellow hover:bg-yellow-light"
                        }`}
                      >
                        {item}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={catalogParams.page === totalPages}
                      onClick={() =>
                        updateRoute({
                          page: String(Math.min(totalPages, catalogParams.page + 1)),
                        })
                      }
                      className="rounded-full border border-gray-3 bg-white px-4 py-2 text-sm text-dark disabled:opacity-45"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className={`fixed inset-0 z-[100000] transition-all duration-300 ${
            isFilterDrawerOpen
              ? "pointer-events-auto bg-dark/35 opacity-100"
              : "pointer-events-none bg-dark/0 opacity-0"
          }`}
          onClick={closeDrawer}
        />

        <aside
          className={`fixed right-0 top-0 z-[100001] flex h-screen w-full max-w-[460px] flex-col bg-white shadow-2xl transition-transform duration-300 ${
            isFilterDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          aria-hidden={!isFilterDrawerOpen}
        >
          <div className="flex items-center justify-between border-b border-gray-3 px-6 py-5 md:px-8">
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-dark">
              Bộ lọc
            </h2>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-3 text-dark transition-colors duration-200 hover:border-dark"
              aria-label="Đóng bộ lọc"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="component-scrollbar flex-1 overflow-y-auto px-6 pb-8 pt-2 md:px-8">
            <DrawerSection
              title="Danh mục"
              isOpen={openSections.category}
              onToggle={() => toggleSection("category")}
            >
              <CustomDropdown
                value={draftFilters.category}
                onChange={(nextValue) =>
                  setDraftFilters((current) => ({ ...current, category: nextValue }))
                }
                options={[
                  { label: "Tất cả danh mục", value: "" },
                  ...categories.map((category) => ({
                    label: category.name,
                    value: category.slug,
                  })),
                ]}
                className="w-full"
                buttonClassName="rounded-2xl px-5 py-4"
                menuClassName="rounded-3xl p-2"
              />
            </DrawerSection>

            <DrawerSection
              title="Màu sắc"
              isOpen={openSections.color}
              onToggle={() => toggleSection("color")}
            >
              <div className="grid grid-cols-2 gap-3">
                {availableColors.map((colorName) => (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => toggleDraftArrayValue("colors", colorName)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      draftFilters.colors.includes(colorName)
                        ? "border-yellow bg-yellow text-dark"
                        : "border-gray-3 bg-white text-dark hover:border-yellow hover:bg-yellow-light"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-white/40"
                      style={{ backgroundColor: colorMap.get(colorName) || "#D8DDE6" }}
                    />
                    <span className="text-sm font-medium">{colorName}</span>
                  </button>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection
              title="Giá"
              isOpen={openSections.price}
              onToggle={() => toggleSection("price")}
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={draftFilters.minPrice}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      minPrice: event.target.value,
                    }))
                  }
                  type="number"
                  placeholder="Từ"
                  className="rounded-full border border-gray-3 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-dark"
                />
                <input
                  value={draftFilters.maxPrice}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      maxPrice: event.target.value,
                    }))
                  }
                  type="number"
                  placeholder="Đến"
                  className="rounded-full border border-gray-3 px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-dark"
                />
              </div>
            </DrawerSection>

            <DrawerSection
              title="Size"
              isOpen={openSections.size}
              onToggle={() => toggleSection("size")}
            >
              <div className="flex flex-wrap gap-3">
                {availableSizes.map((sizeName) => (
                  <button
                    key={sizeName}
                    type="button"
                    onClick={() => toggleDraftArrayValue("sizes", sizeName)}
                    className={`min-w-[58px] rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                      draftFilters.sizes.includes(sizeName)
                        ? "border-yellow bg-yellow text-dark"
                        : "border-gray-3 bg-white text-dark hover:border-yellow hover:bg-yellow-light"
                    }`}
                  >
                    {sizeName}
                  </button>
                ))}
              </div>
            </DrawerSection>
          </div>

          <div className="border-t border-gray-3 bg-white px-6 py-5 md:px-8">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-full border border-gray-3 px-5 py-2.5 text-sm text-dark transition-colors duration-200 hover:border-dark"
              >
                Xóa lọc
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="w-full rounded-full bg-yellow-light px-5 py-2.5 text-sm font-medium text-dark transition-colors duration-200 hover:bg-yellow"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
};

export default ShopWithSidebar;
