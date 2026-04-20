"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    LogOut
} from "lucide-react";
import { clearAuthSession } from "@/libs/auth-storage";

const sidebarLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/staffs", label: "Quản lý nhân viên", icon: Users },
    { href: "/admin/products", label: "Sản phẩm", icon: Package },
    { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
    { href: "/admin/settings", label: "Cài đặt", icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white shadow-xl flex flex-col">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    B-GEY Admin
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 mt-4">
                {sidebarLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => {
                        clearAuthSession();
                        window.location.href = "/admin/login";
                    }}
                    className="flex items-center gap-3 w-full p-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}
