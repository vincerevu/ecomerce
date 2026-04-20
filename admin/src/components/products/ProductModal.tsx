import { useEffect, useState } from "react";
import { categoryApi } from "../../api/categoryApi";
import { ProductPayload } from "../../api/productApi";
import { Tag, tagApi } from "../../api/tagApi";
import ImageUpload from "../common/ImageUpload";
import Select from "../form/Select";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { showError, showSuccess } from "../../utils/toast";

interface CategoryOption {
    id: string;
    name: string;
}

interface ProductTagValue {
    id?: string;
    name?: string;
    slug?: string;
}

interface ProductColorValue {
    id?: string;
    colorName?: string;
    hexCode?: string;
    imageUrls?: string[];
    variants?: Array<{
        id?: string;
        sizeName?: string;
        originalPrice?: number;
        salePrice?: number;
        stockQuantity?: number;
    }>;
    images?: Array<{
        url: string;
        sortOrder?: number;
    }>;
}

export interface ProductFormProduct {
    id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    material?: string;
    gender?: string;
    style?: string;
    status?: "ACTIVE" | "INACTIVE";
    category?: { id: string; name: string };
    tags?: Array<ProductTagValue | string>;
    colors?: ProductColorValue[];
}

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: ProductPayload) => void;
    product?: ProductFormProduct | null;
    embedded?: boolean;
}

type Tab = "info" | "variants" | "tags";

const GENDER_OPTIONS = [
    { value: "", label: "Chọn giới tính..." },
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "UNISEX", label: "Unisex" },
];

const STYLE_OPTIONS = [
    { value: "", label: "Chọn kiểu dáng..." },
    { value: "CASUAL", label: "Casual" },
    { value: "REGULAR", label: "Regular" },
    { value: "SLIM_FIT", label: "Slim fit" },
    { value: "OVERSIZE", label: "Oversize" },
    { value: "SPORT", label: "Sport" },
    { value: "STREETWEAR", label: "Streetwear" },
];

type VariantForm = {
    id?: string;
    sizeName: string;
    originalPrice: number;
    salePrice: number;
    stockQuantity: number;
};

type ColorForm = {
    id?: string;
    colorName: string;
    hexCode: string;
    imageUrls: string[];
    variants: VariantForm[];
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

const newVariant = (): VariantForm => ({
    id: crypto.randomUUID(),
    sizeName: "",
    originalPrice: 0,
    salePrice: 0,
    stockQuantity: 0,
});

const newColor = (): ColorForm => ({
    id: crypto.randomUUID(),
    colorName: "",
    hexCode: "#6D28D9",
    imageUrls: [],
    variants: [newVariant()],
});

export default function ProductModal({ isOpen, onClose, onSave, product, embedded = false }: ProductModalProps) {
    const isEdit = Boolean(product);
    const [tab, setTab] = useState<Tab>("info");
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManual, setSlugManual] = useState(false);
    const [categoryId, setCategoryId] = useState("");
    const [material, setMaterial] = useState("");
    const [gender, setGender] = useState("");
    const [style, setStyle] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
    const [colors, setColors] = useState<ColorForm[]>([newColor()]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
    const [tagOptions, setTagOptions] = useState<Tag[]>([]);
    const [newTagName, setNewTagName] = useState("");
    const [newTagSlug, setNewTagSlug] = useState("");
    const [showTagCreator, setShowTagCreator] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
    const [draggedImage, setDraggedImage] = useState<{ colorIndex: number; imageIndex: number } | null>(null);
    const [dragOverImage, setDragOverImage] = useState<{ colorIndex: number; imageIndex: number } | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        void Promise.all([categoryApi.getAll(), tagApi.getAll()]).then(([categories, tags]) => {
            if (categories.code === 1000) setCategoryOptions(categories.result || []);
            if (tags.code === 1000) setTagOptions(tags.result || []);
        });
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        setTab("info");

        if (product) {
            setName(product.name || "");
            setSlug(product.slug || "");
            setSlugManual(true);
            setCategoryId(product.category?.id || "");
            setMaterial(product.material || "");
            setGender(product.gender || "");
            setStyle(product.style || "");
            setShortDescription(product.shortDescription || "");
            setDescription(product.description || "");
            setStatus(product.status || "ACTIVE");
            setSelectedTags((product.tags?.map((tag) => (typeof tag === "string" ? tag : tag.id)).filter(Boolean) as string[]) || []);
            setColors(
                product.colors?.length
                    ? product.colors.map((color) => ({
                          id: color.id,
                          colorName: color.colorName || "",
                          hexCode: color.hexCode || "#6D28D9",
                          imageUrls: color.images?.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((image) => image.url) || color.imageUrls || [],
                          variants: color.variants?.length
                              ? color.variants.map((variant) => ({
                                    id: variant.id,
                                    sizeName: variant.sizeName || "",
                                    originalPrice: variant.originalPrice || 0,
                                    salePrice: variant.salePrice || 0,
                                    stockQuantity: variant.stockQuantity || 0,
                                }))
                              : [newVariant()],
                      }))
                    : [newColor()]
            );
        } else {
            setName("");
            setSlug("");
            setSlugManual(false);
            setCategoryId("");
            setMaterial("");
            setGender("");
            setStyle("");
            setShortDescription("");
            setDescription("");
            setStatus("ACTIVE");
            setSelectedTags([]);
            setColors([newColor()]);
        }

        setShowTagCreator(false);
        setNewTagName("");
        setNewTagSlug("");
    }, [isOpen, product]);

    useEffect(() => {
        if (!slugManual && name) setSlug(slugify(name));
    }, [name, slugManual]);

    useEffect(() => {
        if (showTagCreator && newTagName) setNewTagSlug(slugify(newTagName));
    }, [newTagName, showTagCreator]);
    const validate = () => {
        if (!name.trim() || !slug.trim() || !categoryId || !description.trim()) return false;
        if (!colors.length) return false;

        return colors.every(
            (color) =>
                color.colorName.trim() &&
                color.hexCode.trim() &&
                color.imageUrls.length > 0 &&
                color.variants.length > 0 &&
                color.variants.every(
                    (variant) =>
                        variant.sizeName.trim() &&
                        Number(variant.originalPrice) >= 0 &&
                        Number(variant.salePrice) > 0 &&
                        Number(variant.originalPrice) >= Number(variant.salePrice) &&
                        Number(variant.stockQuantity) >= 0
                )
        );
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim() || !newTagSlug.trim()) return;

        try {
            const response = await tagApi.create({ name: newTagName, slug: newTagSlug });
            if (response.code === 1000) {
                const createdTag = response.result as Tag;
                setTagOptions((prev) => [...prev, createdTag]);
                setSelectedTags((prev) => [...prev, createdTag.id]);
                setShowTagCreator(false);
                setNewTagName("");
                setNewTagSlug("");
                showSuccess("Đã thêm tag mới thành công.");
            }
        } catch (error) {
            console.error("Failed to create tag", error);
            showError("Không thể tạo tag mới.");
        }
    };

    const handleDeleteTag = async () => {
        if (!tagToDelete) return;

        try {
            const response = await tagApi.delete(tagToDelete.id);
            if (response.code === 1000) {
                setTagOptions((prev) => prev.filter((tag) => tag.id !== tagToDelete.id));
                setSelectedTags((prev) => prev.filter((tagId) => tagId !== tagToDelete.id));
                setTagToDelete(null);
                showSuccess("Đã xóa tag thành công.");
            }
        } catch (error) {
            console.error("Failed to delete tag", error);
            showError("Không thể xóa tag.");
        }
    };

    const handleSave = () => {
        if (!validate()) {
            showError("Vui lòng hoàn thiện đầy đủ thông tin sản phẩm.");
            return;
        }

        onSave({
            name,
            slug,
            shortDescription,
            description,
            material,
            gender: gender || undefined,
            style: style || undefined,
            categoryId,
            tagIds: selectedTags,
            status,
            colors: colors.map((color) => ({
                colorName: color.colorName,
                hexCode: color.hexCode.trim(),
                imageUrls: color.imageUrls,
                variants: color.variants.map((variant) => ({
                    sizeName: variant.sizeName,
                    originalPrice: Number(variant.originalPrice),
                    salePrice: Number(variant.salePrice),
                    stockQuantity: Number(variant.stockQuantity),
                })),
            })),
        });
    };

    const moveColorImage = (colorIndex: number, fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        setColors((prev) =>
            prev.map((item, index) => {
                if (index !== colorIndex) return item;

                const nextImages = [...item.imageUrls];
                const [movedImage] = nextImages.splice(fromIndex, 1);
                nextImages.splice(toIndex, 0, movedImage);

                return {
                    ...item,
                    imageUrls: nextImages,
                };
            })
        );
    };

    if (!isOpen && !embedded) return null;

    const content = (
        <>
            <div className={`relative flex ${embedded ? "min-h-[720px]" : "max-h-[calc(100vh-24px)]"} w-full ${embedded ? "" : "max-w-3xl"} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900`}>
                <div className="shrink-0 flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
                        </h2>
                        <p className="mt-0.5 text-xs text-gray-400">
                            {isEdit ? `ID: ${product?.id}` : "Điền đầy đủ thông tin để tạo sản phẩm"}
                        </p>
                    </div>

                    {!embedded ? (
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.07]"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    ) : <div className="h-8 w-8" />}
                </div>

                <div className="shrink-0 flex gap-1 border-b border-gray-100 px-6 dark:border-white/[0.06]">
                    {(["info", "variants", "tags"] as Tab[]).map((item) => (
                        <button
                            key={item}
                            onClick={() => setTab(item)}
                            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === item ? "border-violet-600 text-violet-700 dark:text-violet-400" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                        >
                            {item === "info" ? "Thông tin chung" : item === "variants" ? "Biến thể & kho" : "Tags"}
                        </button>
                    ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {tab === "info" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên sản phẩm" className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white" />
                                <input value={slug} onChange={(event) => { setSlug(event.target.value); setSlugManual(true); }} placeholder="slug-san-pham" className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-white/[0.04] dark:text-white" />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Select value={categoryId} onChange={setCategoryId} options={[{ value: "", label: "Chọn danh mục..." }, ...categoryOptions.map((item) => ({ value: item.id, label: item.name }))]} />
                                <Select value={status} onChange={(value) => setStatus(value as "ACTIVE" | "INACTIVE")} options={[{ value: "ACTIVE", label: "Đang bán" }, { value: "INACTIVE", label: "Ngừng bán" }]} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <input value={material} onChange={(event) => setMaterial(event.target.value)} placeholder="Chất liệu" className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white" />
                                <Select value={gender} onChange={setGender} options={GENDER_OPTIONS} />
                                <Select value={style} onChange={setStyle} options={STYLE_OPTIONS} />
                            </div>
                            <textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} rows={2} placeholder="Mô tả ngắn" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white" />
                            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Mô tả chi tiết" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white" />
                        </div>
                    )}
                    {tab === "variants" && (
                        <div className="space-y-4">
                            {colors.map((color, colorIndex) => (
                                <div key={color.id || colorIndex} className="space-y-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px_auto]">
                                        <input value={color.colorName} onChange={(event) => setColors((prev) => prev.map((item, index) => index === colorIndex ? { ...item, colorName: event.target.value } : item))} placeholder="Tên màu" className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white" />

                                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 dark:border-gray-700">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/[0.04]">
                                                <span className="h-6 w-6 rounded-full border border-gray-200 shadow-sm dark:border-gray-600" style={{ backgroundColor: color.hexCode.trim() || "#6D28D9" }} />
                                            </div>
                                            <input value={color.hexCode} onChange={(event) => setColors((prev) => prev.map((item, index) => index === colorIndex ? { ...item, hexCode: event.target.value } : item))} placeholder="#6D28D9" className="h-10 flex-1 bg-transparent font-mono text-sm outline-none dark:text-white" />
                                        </div>

                                        <button onClick={() => setColors((prev) => prev.length > 1 ? prev.filter((_, index) => index !== colorIndex) : prev)} className="h-10 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-500 hover:bg-red-50">
                                            Xóa màu
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-start gap-3">
                                        {color.imageUrls.map((imageUrl, imageIndex) => (
                                            <div
                                                key={`${imageUrl}-${imageIndex}`}
                                                className={`relative shrink-0 rounded-2xl transition-all duration-200 ${
                                                    draggedImage?.colorIndex === colorIndex && draggedImage.imageIndex === imageIndex
                                                        ? "z-20 scale-105 -rotate-2 opacity-70 shadow-2xl shadow-violet-200/70"
                                                        : ""
                                                } ${
                                                    dragOverImage?.colorIndex === colorIndex && dragOverImage.imageIndex === imageIndex
                                                        ? "scale-105 ring-2 ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                                                        : ""
                                                }`}
                                                draggable
                                                onDragStart={() => setDraggedImage({ colorIndex, imageIndex })}
                                                onDragOver={(event) => {
                                                    event.preventDefault();
                                                    if (!draggedImage || draggedImage.colorIndex !== colorIndex) return;
                                                    if (dragOverImage?.colorIndex === colorIndex && dragOverImage.imageIndex === imageIndex) return;
                                                    setDragOverImage({ colorIndex, imageIndex });
                                                }}
                                                onDragEnter={() => {
                                                    if (!draggedImage || draggedImage.colorIndex !== colorIndex) return;
                                                    setDragOverImage({ colorIndex, imageIndex });
                                                }}
                                                onDragLeave={() => {
                                                    if (dragOverImage?.colorIndex === colorIndex && dragOverImage.imageIndex === imageIndex) {
                                                        setDragOverImage(null);
                                                    }
                                                }}
                                                onDrop={() => {
                                                    if (!draggedImage || draggedImage.colorIndex !== colorIndex) return;
                                                    moveColorImage(colorIndex, draggedImage.imageIndex, imageIndex);
                                                    setDraggedImage(null);
                                                    setDragOverImage(null);
                                                }}
                                                onDragEnd={() => {
                                                    setDraggedImage(null);
                                                    setDragOverImage(null);
                                                }}
                                            >
                                                {dragOverImage?.colorIndex === colorIndex && dragOverImage.imageIndex === imageIndex && (
                                                    <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-violet-400 bg-violet-500/10" />
                                                )}
                                                <ImageUpload
                                                    value={imageUrl}
                                                    onChange={(value) => setColors((prev) => prev.map((item, index) => index === colorIndex ? { ...item, imageUrls: item.imageUrls.map((url, currentIndex) => currentIndex === imageIndex ? value : url) } : item))}
                                                    className="h-14 w-14"
                                                    folder="ecommerce/products"
                                                    mode="compact"
                                                />
                                                <div className={`absolute left-1.5 top-1.5 z-30 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold shadow-sm ${imageIndex === 0 ? "bg-violet-600 text-white" : "bg-black/65 text-white"}`}>
                                                    {imageIndex + 1}
                                                </div>
                                                <button onClick={() => setColors((prev) => prev.map((item, index) => index === colorIndex ? { ...item, imageUrls: item.imageUrls.filter((_, currentIndex) => currentIndex !== imageIndex) } : item))} className="absolute right-1 top-1 z-30 rounded-full bg-black/60 p-1 text-white">
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}

                                        <div className="flex min-h-14 shrink-0 items-center">
                                            <ImageUpload
                                                onChange={(value) =>
                                                    setColors((prev) =>
                                                        prev.map((item, index) =>
                                                            index === colorIndex
                                                                ? { ...item, imageUrls: [...item.imageUrls, value] }
                                                                : item
                                                        )
                                                    )
                                                }
                                                className="w-auto"
                                                folder="ecommerce/products"
                                                mode="button"
                                                multiple
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {color.variants.map((variant, variantIndex) => (
                                            <div key={variant.id || variantIndex} className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr_1fr_1fr_auto]">
                                                <input
                                                    value={variant.sizeName}
                                                    onChange={(event) =>
                                                        setColors((prev) =>
                                                            prev.map((item, index) =>
                                                                index !== colorIndex
                                                                    ? item
                                                                    : {
                                                                          ...item,
                                                                          variants: item.variants.map((currentVariant, currentIndex) =>
                                                                              currentIndex === variantIndex
                                                                                  ? { ...currentVariant, sizeName: event.target.value }
                                                                                  : currentVariant
                                                                          ),
                                                                      }
                                                            )
                                                        )
                                                    }
                                                    placeholder="Size"
                                                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
                                                />
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={variant.originalPrice || ""}
                                                    onChange={(event) =>
                                                        setColors((prev) =>
                                                            prev.map((item, index) =>
                                                                index !== colorIndex
                                                                    ? item
                                                                    : {
                                                                          ...item,
                                                                          variants: item.variants.map((currentVariant, currentIndex) =>
                                                                              currentIndex === variantIndex
                                                                                  ? { ...currentVariant, originalPrice: Number(event.target.value) }
                                                                                  : currentVariant
                                                                          ),
                                                                      }
                                                            )
                                                        )
                                                    }
                                                    placeholder="Giá gốc"
                                                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
                                                />
                                                <input
                                                    type="number"
                                                    value={variant.salePrice || ""}
                                                    onChange={(event) =>
                                                        setColors((prev) =>
                                                            prev.map((item, index) =>
                                                                index !== colorIndex
                                                                    ? item
                                                                    : {
                                                                          ...item,
                                                                          variants: item.variants.map((currentVariant, currentIndex) =>
                                                                              currentIndex === variantIndex
                                                                                  ? { ...currentVariant, salePrice: Number(event.target.value) }
                                                                                  : currentVariant
                                                                          ),
                                                                      }
                                                            )
                                                        )
                                                    }
                                                    placeholder="Giá bán"
                                                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
                                                />
                                                <input
                                                    type="number"
                                                    value={variant.stockQuantity || ""}
                                                    onChange={(event) =>
                                                        setColors((prev) =>
                                                            prev.map((item, index) =>
                                                                index !== colorIndex
                                                                    ? item
                                                                    : {
                                                                          ...item,
                                                                          variants: item.variants.map((currentVariant, currentIndex) =>
                                                                              currentIndex === variantIndex
                                                                                  ? { ...currentVariant, stockQuantity: Number(event.target.value) }
                                                                                  : currentVariant
                                                                          ),
                                                                      }
                                                            )
                                                        )
                                                    }
                                                    placeholder="Tồn kho"
                                                    className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
                                                />
                                                <button
                                                    onClick={() =>
                                                        setColors((prev) =>
                                                            prev.map((item, index) =>
                                                                index !== colorIndex
                                                                    ? item
                                                                    : {
                                                                          ...item,
                                                                          variants:
                                                                              item.variants.length > 1
                                                                                  ? item.variants.filter((_, currentIndex) => currentIndex !== variantIndex)
                                                                                  : item.variants,
                                                                      }
                                                            )
                                                        )
                                                    }
                                                    className="h-10 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-500 hover:bg-red-50"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        ))}

                                        <button onClick={() => setColors((prev) => prev.map((item, index) => index === colorIndex ? { ...item, variants: [...item.variants, newVariant()] } : item))} className="text-xs font-medium text-violet-600 hover:text-violet-800">
                                            + Thêm size
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button onClick={() => setColors((prev) => [...prev, newColor()])} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-50">
                                + Thêm màu sắc
                            </button>
                        </div>
                    )}

                    {tab === "tags" && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">Chọn tags phù hợp để giúp khách hàng tìm kiếm sản phẩm dễ hơn.</p>

                            <div className="flex flex-wrap gap-2">
                                {tagOptions.map((tag) => (
                                    <div key={tag.id} className="group relative">
                                        <button
                                            onClick={() => setSelectedTags((prev) => prev.includes(tag.id) ? prev.filter((tagId) => tagId !== tag.id) : [...prev, tag.id])}
                                            className={`rounded-full border px-4 py-2 text-sm font-medium ${selectedTags.includes(tag.id) ? "border-violet-600 bg-violet-600 text-white" : "border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 dark:border-gray-700 dark:text-gray-400"}`}
                                        >
                                            {tag.name}
                                        </button>

                                        <button onClick={() => setTagToDelete(tag)} className="absolute -right-1 -top-2 hidden rounded-full border border-gray-100 bg-white p-1 text-gray-400 shadow-sm hover:text-red-500 group-hover:block dark:border-gray-700 dark:bg-gray-800">
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {!showTagCreator ? (
                                    <button onClick={() => setShowTagCreator(true)} className="rounded-full border-2 border-dashed border-violet-200 px-4 py-2 text-sm font-medium text-violet-500 hover:border-violet-400 hover:bg-violet-50">
                                        + Thêm tag mới
                                    </button>
                                ) : (
                                    <div className="w-full rounded-2xl border border-violet-200 bg-violet-50/30 p-3 sm:w-auto">
                                        <div className="space-y-2">
                                            <input autoFocus value={newTagName} onChange={(event) => setNewTagName(event.target.value)} placeholder="Tên tag" className="h-8 w-full rounded-lg border border-violet-100 bg-white px-3 text-sm text-violet-900 outline-none focus:border-violet-400 dark:bg-gray-800 sm:w-40" />
                                            <input value={newTagSlug} onChange={(event) => setNewTagSlug(event.target.value)} placeholder="slug" className="h-8 w-full rounded-lg border border-violet-100 bg-white px-3 font-mono text-xs text-violet-700 outline-none focus:border-violet-400 dark:bg-gray-800 sm:w-40" />
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                            <button onClick={handleCreateTag} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white">
                                                Lưu
                                            </button>
                                            <button onClick={() => setShowTagCreator(false)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-white">
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <button onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.06]">
                        Hủy
                    </button>

                    <div className="flex items-center gap-2">
                        {tab !== "tags" && (
                            <button onClick={() => setTab(tab === "info" ? "variants" : "tags")} className="h-10 rounded-lg border border-violet-300 px-5 text-sm font-medium text-violet-700 hover:bg-violet-50">
                                Tiếp theo
                            </button>
                        )}

                        <button onClick={handleSave} className="h-10 rounded-lg bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700">
                            {isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
                        </button>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={Boolean(tagToDelete)}
                onClose={() => setTagToDelete(null)}
                onConfirm={handleDeleteTag}
                title="Xác nhận xóa tag"
                message={`Bạn có chắc chắn muốn xóa tag "${tagToDelete?.name}"?`}
                confirmText="Xóa tag"
                cancelText="Hủy"
                loading={false}
                variant="danger"
            />
        </>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-[9000] flex items-start justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
            <div className="fixed inset-0" onClick={onClose} />
            {content}
        </div>
    );
}
