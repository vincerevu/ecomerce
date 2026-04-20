import { useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { hasAnyPermission } from "../components/auth/PermissionGuard";
import TeamTable from "../components/tables/TeamTable";
import MemberModal from "../components/team/AddMemberModal";
import { useAuth } from "../context/AuthContext";

export default function Team() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAddMember = () => {
        setIsModalOpen(true);
    };
    const canCreate = hasAnyPermission(user, "USER:CREATE");

    const handleSuccess = () => {
        setRefreshKey((prev) => prev + 1);
        setIsModalOpen(false);
    };

    return (
        <>
            <PageMeta
                title="Đội ngũ | Hệ thống Admin"
                description="Trang quản lý đội ngũ nhân sự và ban quản trị"
            />
            <div className="mb-6">
                <PageBreadcrumb pageTitle="Thành viên Đội ngũ" />
            </div>

            <div className="space-y-6">
                <TeamTable
                    key={refreshKey}
                    onView={(member) => navigate(`/team/${member.id}`)}
                    onCreate={canCreate ? handleAddMember : undefined}
                />
            </div>

            <MemberModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                member={null}
            />
        </>
    );
}
