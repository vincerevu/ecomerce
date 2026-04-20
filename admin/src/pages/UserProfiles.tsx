import { useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../context/AuthContext";

export default function UserProfiles() {
  const { refreshUserData } = useAuth();

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  return (
    <>
      <PageMeta
        title="Hồ sơ người dùng | BAGY - Ecommerce Admin Dashboard"
        description="Trang hồ sơ người dùng của BAGY Ecommerce"
      />
      <PageBreadcrumb pageTitle="Hồ sơ" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Thông tin cá nhân
        </h3>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}
