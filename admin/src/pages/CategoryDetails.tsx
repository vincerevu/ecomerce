import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { categoryApi } from "../api/categoryApi";
import ImageUpload from "../components/common/ImageUpload";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Select, { type Option } from "../components/form/Select";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon, PencilIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  sortOrder?: number;
  parent?: { id: string; name: string };
};

export default function CategoryDetails() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasImageError, setHasImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [parentOptions, setParentOptions] = useState<Option[]>([{ value: "", label: "Không có (Danh mục gốc)" }]);

  useEffect(() => {
    if (!categoryId) {
      setIsLoading(false);
      return;
    }
    const loadCategory = async () => {
      try {
        setIsLoading(true);
        setHasImageError(false);
        const response = await categoryApi.getById(categoryId);
        const nextCategory = response.result;
        setCategory(nextCategory);
        setName(nextCategory.name || "");
        setSlug(nextCategory.slug || "");
        setDescription(nextCategory.description || "");
        setIconUrl(nextCategory.iconUrl || "");
        setParentId(nextCategory.parent?.id || "");
        setSortOrder(nextCategory.sortOrder || 0);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to load category", error);
        showError("Không thể tải thông tin danh mục.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadCategory();
  }, [categoryId]);

  useEffect(() => {
    const loadParentOptions = async () => {
      try {
        const response = await categoryApi.getAll();
        if (response.code === 1000) {
          const options = (response.result || [])
            .filter((item: CategoryRecord) => item.id !== categoryId)
            .map((item: CategoryRecord) => ({
              value: item.id,
              label: item.name,
            }));
          setParentOptions([{ value: "", label: "Không có (Danh mục gốc)" }, ...options]);
        }
      } catch (error) {
        console.error("Failed to load parent categories", error);
      }
    };

    void loadParentOptions();
  }, [categoryId]);

  const handleCancelEdit = () => {
    if (!category) return;
    setName(category.name || "");
    setSlug(category.slug || "");
    setDescription(category.description || "");
    setIconUrl(category.iconUrl || "");
    setParentId(category.parent?.id || "");
    setSortOrder(category.sortOrder || 0);
    setHasImageError(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!categoryId) return;

    try {
      const response = await categoryApi.update(categoryId, {
        name,
        slug,
        description,
        iconUrl,
        parentId: parentId || null,
        sortOrder,
      });
      setCategory(response.result);
      setName(response.result.name || "");
      setSlug(response.result.slug || "");
      setDescription(response.result.description || "");
      setIconUrl(response.result.iconUrl || "");
      setParentId(response.result.parent?.id || "");
      setSortOrder(response.result.sortOrder || 0);
      setHasImageError(false);
      setIsEditing(false);
      showSuccess("Cập nhật danh mục thành công.");
    } catch (error) {
      console.error("Failed to update category", error);
      showError("Không thể cập nhật danh mục.");
    }
  };

  if (isLoading) {
    return (
      <>
        <PageMeta title="Chi tiết danh mục | Hệ thống Admin" description="Xem chi tiết danh mục" />
        <PageBreadcrumb pageTitle="Chi tiết danh mục" />
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải chi tiết danh mục...</span>
          </div>
        </div>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <PageMeta title="Không tìm thấy danh mục | Hệ thống Admin" description="Không tìm thấy danh mục yêu cầu" />
        <PageBreadcrumb pageTitle="Chi tiết danh mục" />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy danh mục cần xem.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/categories")}>
            Quay lại danh sách danh mục
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`${category.name} | Hệ thống Admin`} description="Xem chi tiết danh mục" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={`Chi tiết ${category.name}`} />
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <Button size="sm" startIcon={<PencilIcon />} onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSave}>
                Lưu thay đổi
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Quay lại
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/categories")}>
            Danh sách danh mục
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ảnh đại diện</h4>
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02]">
            {iconUrl && !hasImageError ? (
              <img
                src={iconUrl}
                alt={category.name}
                className="h-72 w-full object-cover"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 px-6 text-center dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-semibold text-slate-600 shadow-sm dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200">
                  {category.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() || "")
                    .join("")}
                </div>
                <p className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-100">{category.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {category.iconUrl ? "Ảnh đại diện không tải được" : "Danh mục chưa có ảnh đại diện"}
                </p>
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  URL ảnh đại diện
                </label>
                <input
                  value={iconUrl}
                  onChange={(event) => {
                    setIconUrl(event.target.value);
                    setHasImageError(false);
                  }}
                  placeholder="https://..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <ImageUpload
                  value={iconUrl}
                  onChange={(url) => {
                    setIconUrl(url);
                    setHasImageError(false);
                  }}
                  folder="ecommerce/categories"
                  mode="button"
                />
                {iconUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIconUrl("");
                      setHasImageError(false);
                    }}
                  >
                    Xóa ảnh
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Danh mục</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{isEditing ? name || "Danh mục" : category.name}</h3>
            <Badge size="sm" color={(isEditing ? parentId : category.parent?.id) ? "info" : "light"} variant="light">
              {(isEditing ? parentId : category.parent?.id) ? "Danh mục con" : "Danh mục gốc"}
            </Badge>
          </div>
          {isEditing ? (
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Slug:</span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                />
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Danh mục cha:</span>
                <div className="mt-1">
                  <Select value={parentId} onChange={setParentId} options={parentOptions} className="w-full" searchable />
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Thứ tự hiển thị:</span>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value))}
                  className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                />
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Tên danh mục:</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-violet-400 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                />
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Mô tả:</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:border-violet-400 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p><span className="font-medium text-gray-900 dark:text-white">Slug:</span> {category.slug}</p>
              <p><span className="font-medium text-gray-900 dark:text-white">Danh mục cha:</span> {category.parent?.name || "Không có"}</p>
              <p><span className="font-medium text-gray-900 dark:text-white">Thứ tự hiển thị:</span> {(category.sortOrder || 0).toLocaleString("vi-VN")}</p>
              <p><span className="font-medium text-gray-900 dark:text-white">Mô tả:</span> {category.description || "Chưa có mô tả"}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
