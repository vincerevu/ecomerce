import { useEffect, useState } from "react";
import { categoryApi } from "../../api/categoryApi";
import ImageUpload from "../common/ImageUpload";
import Select from "../form/Select";

interface CategoryNode {
    id: string;
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    sortOrder?: number;
    parent?: { id: string };
}

interface CategoryPayload {
    name: string;
    slug: string;
    description: string;
    iconUrl: string;
    parentId: string | null;
    sortOrder: number;
}

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: CategoryPayload) => void;
    category?: CategoryNode | null;
    embedded?: boolean;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

export default function CategoryModal({ isOpen, onClose, onSave, category, embedded = false }: CategoryModalProps) {
    const isEdit = Boolean(category);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugManual, setSlugManual] = useState(false);
    const [description, setDescription] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [parentId, setParentId] = useState("");
    const [sortOrder, setSortOrder] = useState(0);
    const [categoriesOptions, setCategoriesOptions] = useState<CategoryNode[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        void categoryApi.getAll().then((response) => {
            if (response.code === 1000) {
                const options = response.result.filter((item: CategoryNode) => !category || item.id !== category.id);
                setCategoriesOptions(options);
            }
        });
    }, [category, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        if (category) {
            setName(category.name || "");
            setSlug(category.slug || "");
            setSlugManual(true);
            setDescription(category.description || "");
            setIconUrl(category.iconUrl || "");
            setParentId(category.parent?.id || "");
            setSortOrder(category.sortOrder || 0);
        } else {
            setName("");
            setSlug("");
            setSlugManual(false);
            setDescription("");
            setIconUrl("");
            setParentId("");
            setSortOrder(0);
        }
    }, [isOpen, category]);

    useEffect(() => {
        if (!slugManual && name) setSlug(slugify(name));
    }, [name, slugManual]);

    const handleSave = () => {
        onSave({
            name,
            slug,
            description,
            iconUrl,
            parentId: parentId || null,
            sortOrder,
        });
    };

    if (!isOpen && !embedded) return null;

    const content = (
        <div className={`relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 ${embedded ? "border border-gray-200 dark:border-white/[0.06]" : "max-w-xl"}`}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.06]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{isEdit ? "Sửa danh mục" : "Thêm danh mục mới"}</h2>
                {!embedded ? (
                    <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                ) : null}
            </div>

            <div className={`${embedded ? "space-y-4 p-6" : "max-h-[80vh] space-y-4 overflow-y-auto p-6"}`}>
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Tên danh mục *</label>
                        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Thời trang nam" className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white" />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Slug</label>
                        <input value={slug} onChange={(event) => { setSlug(event.target.value); setSlugManual(true); }} className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 font-mono text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:bg-white/5" />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Danh mục cha</label>
                        <Select
                            value={parentId}
                            onChange={setParentId}
                            options={[{ value: "", label: "Không có (Danh mục gốc)" }, ...categoriesOptions.map((item) => ({ value: item.id, label: item.name }))]}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Mô tả</label>
                        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-gray-200 bg-transparent p-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700 dark:text-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">Thứ tự hiển thị</label>
                            <input type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} className="h-10 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm outline-none focus:border-violet-400 dark:border-gray-700" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-center text-xs font-semibold text-gray-600 dark:text-gray-400">Icon / Ảnh đại diện</label>
                        <div className="mt-2 flex justify-center">
                            <ImageUpload value={iconUrl} onChange={setIconUrl} className="h-24 w-24" folder="ecommerce/categories" />
                        </div>
                    </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800">Hủy</button>
                <button onClick={handleSave} className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 dark:shadow-none">Lưu thay đổi</button>
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
