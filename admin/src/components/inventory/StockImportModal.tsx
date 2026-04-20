import { useMemo, useState } from "react";
import type {
  CreateStockImportReceiptPayload,
  InventoryStockRecord,
} from "../../api/inventoryApi";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

interface StockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateStockImportReceiptPayload) => void;
  stocks: InventoryStockRecord[];
  isSaving?: boolean;
}

type ReceiptLine = {
  id: string;
  productVariantId: string;
  quantity: number;
  unitCost: number;
};

const createLine = (): ReceiptLine => ({
  id: crypto.randomUUID(),
  productVariantId: "",
  quantity: 1,
  unitCost: 0,
});

export default function StockImportModal({
  isOpen,
  onClose,
  onSave,
  stocks,
  isSaving = false,
}: StockImportModalProps) {
  const [supplierName, setSupplierName] = useState("");
  const [note, setNote] = useState("");
  const [receiptCode, setReceiptCode] = useState("");
  const [lines, setLines] = useState<ReceiptLine[]>([createLine()]);

  const stockOptions = useMemo(
    () => [
      { value: "", label: "Chọn biến thể..." },
      ...stocks.map((stock) => ({
        value: stock.productVariantId,
        label: `${stock.productName} • ${stock.colorName} • Size ${stock.sizeName}`,
      })),
    ],
    [stocks],
  );

  const resetState = () => {
    setSupplierName("");
    setNote("");
    setReceiptCode("");
    setLines([createLine()]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = () => {
    const validLines = lines.filter(
      (line) => line.productVariantId && line.quantity > 0 && line.unitCost >= 0,
    );

    if (validLines.length === 0) {
      return;
    }

    onSave({
      receiptCode: receiptCode.trim() || undefined,
      supplierName: supplierName.trim() || undefined,
      note: note.trim() || undefined,
      items: validLines.map((line) => ({
        productVariantId: line.productVariantId,
        quantity: line.quantity,
        unitCost: line.unitCost,
      })),
    });
    resetState();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-3xl">
      <div className="p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tạo phiếu nhập kho
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ghi nhận lô nhập mới và cộng tồn kho trực tiếp vào biến thể tương ứng.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={receiptCode}
              onChange={(event) => setReceiptCode(event.target.value)}
              placeholder="Mã phiếu nhập (tùy chọn)"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
            />
            <input
              value={supplierName}
              onChange={(event) => setSupplierName(event.target.value)}
              placeholder="Nhà cung cấp"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
            />
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ghi chú phiếu nhập"
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
          />

          <div className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="grid gap-2 rounded-xl border border-gray-100 p-3 dark:border-white/[0.06] lg:grid-cols-[1.6fr_140px_180px_auto]"
              >
                <Select
                  value={line.productVariantId}
                  onChange={(value) =>
                    setLines((prev) =>
                      prev.map((item) =>
                        item.id === line.id ? { ...item, productVariantId: value } : item,
                      ),
                    )
                  }
                  options={stockOptions}
                />
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item) =>
                        item.id === line.id
                          ? { ...item, quantity: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                  placeholder="Số lượng"
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
                <input
                  type="number"
                  min={0}
                  value={line.unitCost}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item) =>
                        item.id === line.id
                          ? { ...item, unitCost: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                  placeholder="Giá nhập / đơn vị"
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-transparent dark:text-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLines((prev) =>
                      prev.length > 1 ? prev.filter((item) => item.id !== line.id) : prev,
                    )
                  }
                  className="h-10 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Xóa
                </button>
                <p className="text-xs text-gray-400 lg:col-span-4">Dòng {index + 1}</p>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, createLine()])}
              className="rounded-lg border border-dashed border-brand-300 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"
            >
              + Thêm dòng nhập
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Lưu phiếu nhập
          </Button>
        </div>
      </div>
    </Modal>
  );
}
