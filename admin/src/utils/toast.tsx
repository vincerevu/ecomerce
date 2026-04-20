import { toast } from "react-hot-toast";

/**
 * Custom Toast implementation for the application.
 */

const variantStyles = {
    success: {
        container: "bg-white dark:bg-gray-900 border-emerald-500 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        iconContainer: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500",
        title: "Thành công"
    },
    error: {
        container: "bg-white dark:bg-gray-900 border-red-500 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        iconContainer: "bg-red-50 dark:bg-red-500/10 text-red-500",
        title: "Lỗi hệ thống"
    },
    warning: {
        container: "bg-white dark:bg-gray-900 border-amber-500 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        iconContainer: "bg-amber-50 dark:bg-amber-500/10 text-amber-500",
        title: "Cảnh báo"
    },
    info: {
        container: "bg-white dark:bg-gray-900 border-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        iconContainer: "bg-blue-50 dark:bg-blue-500/10 text-blue-500",
        title: "Thông tin"
    }
};

const getIcon = (variant: keyof typeof variantStyles) => {
    switch (variant) {
        case 'success':
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            );
        case 'error':
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            );
        case 'warning':
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            );
        default:
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            );
    }
};

const showToast = (variant: keyof typeof variantStyles, message: string, title?: string) => {
    const style = variantStyles[variant];

    return toast.custom((t) => (
        <div
            className={`${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                } max-w-sm w-full border-l-4 rounded-xl pointer-events-auto flex p-4 ${style.container} transition-all duration-300 ease-out`}
        >
            <div className="flex-1 w-0">
                <div className="flex items-start">
                    <div className={`flex-shrink-0 pt-0.5 rounded-full p-2 ${style.iconContainer}`}>
                        {getIcon(variant)}
                    </div>
                    <div className="ml-4 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                            {title || style.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="rounded-lg p-1 inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none transition-colors cursor-pointer"
                >
                    <span className="sr-only">Đóng</span>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    ), {
        duration: 4000,
        position: 'top-right'
    });
};

export const showSuccess = (message: string, title?: string) => showToast('success', message, title);
export const showError = (message: string, title?: string) => showToast('error', message, title);
export const showWarning = (message: string, title?: string) => showToast('warning', message, title);
export const showInfo = (message: string, title?: string) => showToast('info', message, title);
