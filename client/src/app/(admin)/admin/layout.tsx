"use client";

import AdminSidebar from "@/components/Admin/AdminSidebar";
import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import "../../css/style.css";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";

    return (
        <html lang="vi">
            <body className="bg-gray-50">
                <Toaster position="top-right" />
                {isLoginPage ? (
                    children
                ) : (
                    <div className="flex min-h-screen">
                        <AdminSidebar />
                        <main className="ml-64 flex-1 p-8">
                            <div className="max-w-7xl mx-auto">
                                {children}
                            </div>
                        </main>
                    </div>
                )}
            </body>
        </html>
    );
}
