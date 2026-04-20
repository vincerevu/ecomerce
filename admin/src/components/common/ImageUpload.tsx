import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import apiClient from "../../api/apiClient";
import Spinner from "../ui/spinner/Spinner";
import { showError, showSuccess, showWarning } from "../../utils/toast";


interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    folder?: string;
    multiple?: boolean;
    mode?: "default" | "button" | "compact";
}

const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    className = "",
    folder = "ecommerce/products",
    multiple = false,
    mode = "default"
}) => {
    const [uploading, setUploading] = useState(false);

    const onDrop = async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = acceptedFiles.map(async (file) => {
                // Quick size check (50MB)
                if (file.size > 50 * 1024 * 1024) {
                    showWarning(`Ảnh ${file.name} quá lớn! Vui lòng chọn ảnh dưới 50MB`);
                    return;
                }

                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", folder);

                const response = await apiClient.post("/media/upload", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (response.data.code === 1000) {
                    onChange(response.data.result.url);
                } else {
                    showError(response.data.message || `Lỗi tải ảnh ${file.name}`);
                }
            });

            await Promise.all(uploadPromises);
            showSuccess(`Đã tải lên ${acceptedFiles.length} ảnh thành công`);
        } catch (error: any) {
            console.error("Upload error:", error);
            const msg = error.response?.data?.message || error.message || "Lỗi kết nối server";
            showError(msg);
        } finally {
            setUploading(false);
        }
    };


    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [],
        },
        multiple: multiple,
    });

    if (mode === "button") {
        return (
            <div className={`relative ${className}`}>
                <div {...getRootProps()} className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all cursor-pointer
                    ${isDragActive
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                        : "border-gray-200 dark:border-white/[0.08] hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-gray-50 dark:hover:bg-white/[0.02]"}
                `}>
                    <input {...getInputProps()} />
                    <div className="text-violet-600">
                        {uploading ? (
                            <Spinner className="w-4 h-4" />
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                                <line x1="16" y1="5" x2="22" y2="5" />
                                <line x1="19" y1="2" x2="19" y2="8" />
                            </svg>
                        )}
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        {uploading ? "Đang tải..." : "Thêm ảnh"}
                    </span>
                </div>
            </div>
        );
    }

    if (mode === "compact") {
        return (
            <div className={`relative ${className}`}>
                <div
                    {...getRootProps()}
                    className={`group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border transition-all duration-200 ${
                        value
                            ? "border-violet-200 bg-gray-100 dark:border-violet-500/30 dark:bg-white/[0.04]"
                            : "border-dashed border-gray-200 bg-gray-50 hover:border-violet-400 hover:bg-violet-50/60 dark:border-white/[0.08] dark:bg-white/[0.02]"
                    } ${isDragActive ? "border-violet-500 ring-2 ring-violet-200" : ""}`}
                >
                    <input {...getInputProps()} />

                    {value ? (
                        <>
                            <img
                                src={value}
                                alt="Preview"
                                className="h-full w-full object-cover"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-violet-600">
                            {uploading ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                                    <line x1="16" y1="5" x2="22" y2="5" />
                                    <line x1="19" y1="2" x2="19" y2="8" />
                                </svg>
                            )}
                        </div>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                            <Spinner className="h-4 w-4 text-violet-600" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full overflow-visible group/container ${className}`}>
            <div
                {...getRootProps()}
                className={`group relative flex flex-col items-center justify-center w-full h-full min-h-[inherit] border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden
                    ${isDragActive
                        ? "border-violet-500 bg-violet-50/50 dark:bg-violet-500/10 scale-[0.99]"
                        : "border-gray-200 dark:border-white/[0.08] hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"}
                    ${value ? "border-solid border-transparent" : ""}
                `}
            >
                <input {...getInputProps()} />

                {value ? (
                    <div className="relative w-full h-full">
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-xl transition-opacity duration-300 group-hover:opacity-90"
                        />
                        {/* Glassmorphism Overlay */}
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white gap-2">
                            <div className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Chọn ảnh khác</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center p-4">
                        <div className="mb-3 p-3 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 transition-transform group-hover:scale-110 duration-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                                <line x1="16" y1="5" x2="22" y2="5" />
                                <line x1="19" y1="2" x2="19" y2="8" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            {isDragActive ? "Thả vào đây" : "Tải ảnh lên"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-tight">PNG, JPG, WebP • Tối đa 50MB</p>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
                        <Spinner className="w-8 h-8 text-violet-600 mb-2" />
                        <span className="text-[10px] font-bold text-violet-600 animate-pulse tracking-widest uppercase">Đang xử lý...</span>
                    </div>
                )}
            </div>

            {value && !uploading && (
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        // Extract public_id from URL if possible, or just clear choice
                        // In a real scenario, we should store publicId from upload response
                        onChange("");
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm text-red-500 rounded-full flex items-center justify-center shadow-lg border border-white/50 hover:bg-red-500 hover:text-white hover:scale-110 transition-all z-20 cursor-pointer opacity-0 group-hover/container:opacity-100 transform translate-y-2 group-hover/container:translate-y-0 duration-300"
                    title="Xóa ảnh"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

        </div>
    );

};

export default ImageUpload;
