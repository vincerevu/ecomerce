"use client";

import { useEffect, useState } from "react";
import apiClient from "@/libs/api-client";
import { toast } from "react-hot-toast";
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Staff {
    id: string;
    username: string;
    email: string;
    fullName: string;
    phone: string;
    active: boolean;
    roles: { name: string }[];
}

export default function StaffManagementPage() {
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStaffs = async () => {
        try {
            const response: any = await apiClient.get("/staffs");
            if (response.code === 1000) {
                setStaffs(response.result);
            }
        } catch (error: any) {
            toast.error("Không thể tải danh sách nhân viên");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaffs();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
        try {
            await apiClient.delete(`/staffs/${id}`);
            toast.success("Xóa nhân viên thành công");
            fetchStaffs();
        } catch (error) {
            toast.error("Xóa thất bại");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân viên</h1>
                    <p className="text-gray-500 mt-1">Danh sách nhân viên trong hệ thống</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20">
                    <Plus size={20} />
                    Thêm nhân viên
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Họ tên</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tài khoản / Email</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Vai trò</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : staffs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                    Chưa có nhân viên nào
                                </td>
                            </tr>
                        ) : (
                            staffs.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                {staff.fullName.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{staff.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="text-gray-900 font-medium">{staff.username}</div>
                                        <div className="text-gray-500">{staff.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {staff.active ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                <CheckCircle size={14} /> Hoạt động
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                <XCircle size={14} /> Khóa
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {staff.roles.map((role) => (
                                                <span key={role.name} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                                    {role.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(staff.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
