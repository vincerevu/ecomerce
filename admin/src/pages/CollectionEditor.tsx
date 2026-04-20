import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { collectionApi, type CollectionPayload, type CollectionRecord } from "../api/collectionApi";
import CollectionModal from "../components/collections/CollectionModal";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { AngleLeftIcon } from "../icons";
import { showError, showSuccess } from "../utils/toast";

export default function CollectionEditor() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(collectionId);

  const [collection, setCollection] = useState<CollectionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(isEdit);

  useEffect(() => {
    if (!collectionId) {
      setCollection(null);
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

  const handleSave = async (payload: CollectionPayload) => {
    try {
      if (collectionId) {
        await collectionApi.update(collectionId, payload);
        showSuccess("Cập nhật bộ sưu tập thành công.");
      } else {
        await collectionApi.create(payload);
        showSuccess("Tạo bộ sưu tập thành công.");
      }

      navigate("/collections");
    } catch (error) {
      console.error("Failed to save collection", error);
      showError("Lưu bộ sưu tập thất bại.");
    }
  };

  return (
    <>
      <PageMeta
        title={`${isEdit ? "Cập nhật" : "Thêm"} bộ sưu tập | Hệ thống Admin`}
        description="Tạo và cập nhật metadata, trạng thái và sản phẩm trong bộ sưu tập"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={isEdit ? "Cập nhật bộ sưu tập" : "Thêm bộ sưu tập"} />
        <Button variant="outline" size="sm" startIcon={<AngleLeftIcon />} onClick={() => navigate("/collections")}>
          Danh sách bộ sưu tập
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader size="md" />
            <span className="text-sm">Đang tải dữ liệu bộ sưu tập...</span>
          </div>
        </div>
      ) : (
        <CollectionModal
          embedded
          isOpen
          onClose={() => navigate("/collections")}
          onSave={handleSave}
          collection={collection}
        />
      )}
    </>
  );
}
