package com.project.ecommerce.modules.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private AdminDashboardMetricsResponse metrics;
    private List<AdminDashboardRevenuePointResponse> revenueTrend;
    private List<AdminDashboardOrderStatusResponse> orderStatuses;
    private List<AdminDashboardPaymentChannelResponse> paymentChannels;
    private List<AdminDashboardRecentOrderResponse> recentOrders;
    private List<AdminDashboardStockAlertResponse> stockAlerts;
}
