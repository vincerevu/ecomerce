import apiClient from "./apiClient";

export interface DashboardMetrics {
  totalOrders: number;
  processingOrders: number;
  deliveredRevenue: number;
  totalPayments: number;
  paidPayments: number;
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  activeCustomers: number;
  totalCategories: number;
  rootCategories: number;
}

export interface DashboardRevenuePoint {
  label: string;
  value: number;
}

export interface DashboardOrderStatusRow {
  label: string;
  count: number;
  percent: number;
  barClass: string;
}

export interface DashboardPaymentChannel {
  label: string;
  count: number;
  amount: number;
  percent: number;
  barClass: string;
}

export interface DashboardRecentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  itemCount: number;
  status: string;
  totalAmount: number;
  createdAt?: string;
}

export interface DashboardStockAlert {
  id: string;
  name: string;
  totalStock: number;
  totalVariants: number;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  revenueTrend: DashboardRevenuePoint[];
  orderStatuses: DashboardOrderStatusRow[];
  paymentChannels: DashboardPaymentChannel[];
  recentOrders: DashboardRecentOrder[];
  stockAlerts: DashboardStockAlert[];
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const dashboardApi = {
  getSummary: async () => {
    const response = await apiClient.get<ApiResponse<DashboardSummary>>("/admin/dashboard");
    return response.data;
  },
};
