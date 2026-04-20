import type { CustomerRecord } from "../../api/customerApi";

export type CustomerSegment = "all" | "loyal" | "new" | "blocked";
export type CustomerSortPreset =
  | ""
  | "recent"
  | "spent"
  | "points"
  | "nameAsc"
  | "nameDesc";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatDate = (value?: string) => {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const getCustomerInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const getCustomerTierLabel = (customer: CustomerRecord) =>
  customer.membershipTier?.tierName?.trim() || "Thành viên mới";

export const buildCustomerSummary = (customers: CustomerRecord[]) => ({
  total: customers.length,
  active: customers.filter((customer) => customer.active).length,
  blocked: customers.filter((customer) => !customer.active).length,
  loyal: customers.filter(
    (customer) =>
      (customer.totalSpent || 0) >= 1_000_000 ||
      ["gold", "vip", "diamond"].includes(
        customer.membershipTier?.tierName?.toLowerCase() || "",
      ),
  ).length,
  totalRevenue: customers.reduce(
    (sum, customer) => sum + (customer.totalSpent || 0),
    0,
  ),
});

export const matchesSegment = (
  customer: CustomerRecord,
  segment: CustomerSegment,
) => {
  if (segment === "blocked") return !customer.active;

  if (segment === "new") {
    if (!customer.createdAt) return false;
    const joinedAt = new Date(customer.createdAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return joinedAt >= sevenDaysAgo;
  }

  if (segment === "loyal") {
    return (
      (customer.totalSpent || 0) >= 1_000_000 ||
      (customer.totalPoints || 0) >= 300 ||
      ["gold", "vip", "diamond"].includes(
        customer.membershipTier?.tierName?.toLowerCase() || "",
      )
    );
  }

  return true;
};

export const filterCustomers = ({
  customers,
  searchTerm,
  tierFilter,
  statusFilter,
  segment,
}: {
  customers: CustomerRecord[];
  searchTerm: string;
  tierFilter: string;
  statusFilter: string;
  segment: CustomerSegment;
}) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return customers.filter((customer) => {
    const matchesSearch =
      !normalizedSearch ||
      customer.name.toLowerCase().includes(normalizedSearch) ||
      customer.phone.toLowerCase().includes(normalizedSearch) ||
      (customer.email || "").toLowerCase().includes(normalizedSearch);

    const matchesTier =
      !tierFilter ||
      (customer.membershipTier?.tierName || "Thành viên mới") === tierFilter;

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "ACTIVE" ? customer.active : !customer.active);

    return (
      matchesSearch &&
      matchesTier &&
      matchesStatus &&
      matchesSegment(customer, segment)
    );
  });
};

export const sortCustomers = (
  customers: CustomerRecord[],
  sortPreset: CustomerSortPreset,
) =>
  [...customers].sort((left, right) => {
    switch (sortPreset) {
      case "":
        return 0;
      case "spent":
        return (right.totalSpent || 0) - (left.totalSpent || 0);
      case "points":
        return (right.totalPoints || 0) - (left.totalPoints || 0);
      case "nameAsc":
        return left.name.localeCompare(right.name, "vi");
      case "nameDesc":
        return right.name.localeCompare(left.name, "vi");
      case "recent":
      default:
        return (
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
        );
    }
  });
