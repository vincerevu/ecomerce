import { useEffect, useMemo, useState } from "react";
import { appSettingApi, type AppSetting } from "../api/appSettingApi";
import Loader from "../components/common/Loader";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { showError, showSuccess } from "../utils/toast";

type SettingDraft = {
  value: string;
  description: string;
  group: string;
  exists: boolean;
  updatedAt?: string;
};

const DEFAULT_SETTINGS: AppSetting[] = [
  { key: "site.name", value: "Bagy", group: "general", description: "Tên hiển thị của website" },
  { key: "site.hotline", value: "1900 0000", group: "general", description: "Hotline hiển thị ở client" },
  { key: "site.email", value: "support@example.com", group: "general", description: "Email hỗ trợ khách hàng" },
  { key: "site.address", value: "Việt Nam", group: "general", description: "Địa chỉ cửa hàng hoặc công ty" },
  { key: "seo.home_title", value: "Bagy", group: "seo", description: "Tiêu đề SEO trang chủ" },
  { key: "seo.home_description", value: "Cửa hàng thời trang trực tuyến", group: "seo", description: "Mô tả SEO trang chủ" },
  { key: "shipping.default_fee", value: "30000", group: "shipping", description: "Phí vận chuyển mặc định" },
  { key: "order.free_shipping_threshold", value: "500000", group: "order", description: "Ngưỡng miễn phí vận chuyển" },
  { key: "social.facebook_url", value: "https://facebook.com", group: "social", description: "Liên kết Facebook" },
  { key: "social.zalo_url", value: "https://zalo.me", group: "social", description: "Liên kết Zalo" },
  { key: "admin.pagination.default_page_size", value: "10", group: "pagination", description: "Số dòng mặc định mỗi trang trong Admin" },
  { key: "client.pagination.default_page_size", value: "12", group: "pagination", description: "Số sản phẩm mặc định mỗi trang ở Client" },
];

const formatGroupLabel = (group: string) => {
  switch (group) {
    case "general":
      return "Thông tin chung";
    case "seo":
      return "SEO";
    case "shipping":
      return "Vận chuyển";
    case "order":
      return "Đơn hàng";
    case "social":
      return "Mạng xã hội";
    case "pagination":
      return "Phân trang";
    default:
      return group || "Khác";
  }
};

const getSettingLabel = (setting: AppSetting, draft?: SettingDraft) => draft?.description || setting.description || setting.key;

const NUMERIC_SETTING_KEYWORDS = [
  "page_size",
  "fee",
  "threshold",
  "amount",
  "price",
  "limit",
  "quantity",
  "count",
  "percent",
  "rate",
];

const isNumericSetting = (setting: AppSetting) => {
  const defaultSetting = DEFAULT_SETTINGS.find((item) => item.key === setting.key);
  const value = defaultSetting?.value ?? setting.value;
  return (
    NUMERIC_SETTING_KEYWORDS.some((keyword) => setting.key.includes(keyword)) ||
    /^-?\d+(\.\d+)?$/.test(String(value).trim())
  );
};

const getNumberInputProps = (key: string) => {
  if (key.includes("pagination.default_page_size")) {
    return { min: 1, step: 1 };
  }

  if (key.includes("fee") || key.includes("threshold") || key.includes("amount") || key.includes("price")) {
    return { min: 0, step: 1000 };
  }

  return { step: 1 };
};

const clearAdminPageSizeOverrides = () => {
  if (typeof window === "undefined") return;

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith("admin.") && key.endsWith(".pageSize"))
    .forEach((key) => window.localStorage.removeItem(key));
};

export default function AppSettings() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SettingDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await appSettingApi.getAll();
      const apiSettings = response.result || [];
      const merged = [
        ...apiSettings,
        ...DEFAULT_SETTINGS.filter((defaultSetting) => !apiSettings.some((setting) => setting.key === defaultSetting.key)),
      ].sort((left, right) => (left.group || "").localeCompare(right.group || "", "vi") || left.key.localeCompare(right.key, "vi"));

      setSettings(merged);
      setDrafts(
        Object.fromEntries(
          merged.map((setting) => [
            setting.key,
            {
              value: setting.value || "",
              description: setting.description || "",
              group: setting.group || "general",
              exists: apiSettings.some((item) => item.key === setting.key),
              updatedAt: setting.updatedAt,
            },
          ]),
        ),
      );
    } catch (error) {
      console.error("Failed to load app settings", error);
      showError("Không thể tải cấu hình app.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const groupedSettings = useMemo(() => {
    return settings.reduce<Record<string, AppSetting[]>>((groups, setting) => {
      const group = drafts[setting.key]?.group || setting.group || "general";
      groups[group] = [...(groups[group] || []), setting];
      return groups;
    }, {});
  }, [drafts, settings]);

  const updateDraftValue = (key: string, value: string) => {
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        value,
      },
    }));
  };

  const saveSetting = async (key: string) => {
    const draft = drafts[key];
    if (!draft?.value.trim()) {
      showError("Giá trị cấu hình không được để trống.");
      return;
    }

    setSavingKey(key);
    try {
      const response = await appSettingApi.update(key, {
        value: draft.value.trim(),
        description: draft.description.trim() || undefined,
        group: draft.group.trim() || "general",
      });

      const saved = response.result;
      setSettings((current) => current.map((setting) => (setting.key === key ? saved : setting)));
      setDrafts((current) => ({
        ...current,
        [key]: {
          value: saved.value || "",
          description: saved.description || "",
          group: saved.group || "general",
          exists: true,
          updatedAt: saved.updatedAt,
        },
      }));
      if (key === "admin.pagination.default_page_size") {
        clearAdminPageSizeOverrides();
      }
      showSuccess("Đã lưu cấu hình app.");
    } catch (error) {
      console.error("Failed to save app setting", error);
      showError("Không thể lưu cấu hình app.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <>
      <PageMeta title="Cài đặt | Hệ thống Admin" description="Quản lý cấu hình động của website" />

      <div className="mb-6">
        <PageBreadcrumb pageTitle="Cài đặt" />
      </div>

      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-white/[0.06] dark:bg-[#111b2d]">
          <Loader size="lg" />
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedSettings).map(([group, groupSettings]) => (
            <section key={group} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111b2d]">
              <div className="border-b border-gray-100 px-5 py-4 dark:border-white/[0.06]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{formatGroupLabel(group)}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{groupSettings.length} cấu hình</p>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {groupSettings.map((setting) => {
                  const draft = drafts[setting.key];
                  return (
                    <div key={setting.key} className="grid grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-[280px_1fr_120px]">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{getSettingLabel(setting, draft)}</p>
                      </div>

                      <div>
                        {isNumericSetting(setting) ? (
                          <input
                            type="number"
                            value={draft?.value || ""}
                            onChange={(event) => updateDraftValue(setting.key, event.target.value)}
                            {...getNumberInputProps(setting.key)}
                            className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90"
                          />
                        ) : (
                          <textarea
                            value={draft?.value || ""}
                            onChange={(event) => updateDraftValue(setting.key, event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/[0.08] dark:bg-[#162033] dark:text-white/90"
                          />
                        )}
                      </div>

                      <div className="flex items-start">
                        <Button onClick={() => saveSetting(setting.key)} isLoading={savingKey === setting.key} className="h-10 px-4 py-2.5">
                          Lưu
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
