import React from "react";
import { Modal } from "./index";
import Button from "../button/Button";
import { AlertHexaIcon } from "../../../icons";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    variant?: "danger" | "warning" | "info";
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận hành động",
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy bỏ",
    loading = false,
    variant = "danger",
}) => {
    const getIconColor = () => {
        switch (variant) {
            case "danger":
                return "text-error-500 bg-error-50 dark:bg-error-500/10";
            case "warning":
                return "text-warning-500 bg-warning-50 dark:bg-warning-500/10";
            case "info":
                return "text-brand-500 bg-brand-50 dark:bg-brand-500/10";
            default:
                return "text-brand-500 bg-brand-50 dark:bg-brand-500/10";
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-[440px]">
            <div className="p-6">
                <div className="flex flex-col items-center text-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full mb-4 ${getIconColor()}`}>
                        <AlertHexaIcon className="h-6 w-6" />
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                        {title}
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {message}
                    </p>
                </div>

                <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onConfirm}
                        className={`flex-1 ${variant === 'danger' ? 'bg-error-500 hover:bg-error-600' : ''}`}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
