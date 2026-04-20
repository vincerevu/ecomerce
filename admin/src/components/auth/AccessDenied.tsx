import { Link } from "react-router";

export default function AccessDenied() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-theme-xl dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m0 3h.008M4.5 19.5h15a1.5 1.5 0 001.299-2.25l-7.5-13a1.5 1.5 0 00-2.598 0l-7.5 13A1.5 1.5 0 004.5 19.5z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Không đủ quyền truy cập</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Tài khoản hiện tại không có quyền mở màn hình này. Hãy đăng nhập bằng tài khoản phù hợp hoặc quay lại trang tổng quan.
                </p>
                <Link
                    to="/"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                    Về trang tổng quan
                </Link>
            </div>
        </div>
    );
}
