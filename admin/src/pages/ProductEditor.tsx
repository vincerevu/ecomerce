import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ProductPayload, productApi } from "../api/productApi";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Loader from "../components/common/Loader";
import Button from "../components/ui/button/Button";
import ProductModal, { ProductFormProduct } from "../components/products/ProductModal";
import { AngleLeftIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

export default function ProductEditor() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(productId);

    const [product, setProduct] = useState<ProductFormProduct | null>(null);
    const [isLoading, setIsLoading] = useState(isEdit);

    useEffect(() => {
        if (!productId) {
            setProduct(null);
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

    const handleSave = async (payload: ProductPayload) => {
        try {
            if (productId) {
                await productApi.update(productId, payload);
                showSuccess("Cập nhật sản phẩm thành công.");
            } else {
                await productApi.create(payload);
                showSuccess("Tạo sản phẩm thành công.");
            }

            navigate("/products");
        } catch (error) {
            console.error("Failed to save product", error);
            showError("Lưu sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.");
        }
    };

    return (
        <>
            <PageMeta
                title={`${isEdit ? "Cập nhật" : "Thêm"} sản phẩm | Hệ thống Admin`}
                description="Tạo và cập nhật thông tin sản phẩm, màu sắc, biến thể và kho hàng"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <PageBreadcrumb pageTitle={isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm"} />
                <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/products")}>
                    Danh sách sản phẩm
                </Button>
            </div>

            {isLoading ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader size="md" />
                        <span className="text-sm">Đang tải dữ liệu sản phẩm...</span>
                    </div>
                </div>
            ) : (
                <ProductModal
                    embedded
                    isOpen
                    onClose={() => navigate("/products")}
                    onSave={handleSave}
                    product={product}
                />
            )}
        </>
    );
}
