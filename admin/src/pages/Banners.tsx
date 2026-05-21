import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BannersTable from "../components/tables/BannersTable";

export default function Banners() {
    return (
        <>
            <PageMeta
                title="Quản lý Banner | Hệ thống Admin"
                description="Quản lý các banner quảng cáo và chiến dịch marketing"
            />

            <div className="mb-6">
                <PageBreadcrumb pageTitle="Quản lý Banner" />
            </div>

            <BannersTable />
        </>
    );
}
