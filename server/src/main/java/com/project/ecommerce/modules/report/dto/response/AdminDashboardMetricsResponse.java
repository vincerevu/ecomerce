package com.project.ecommerce.modules.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardMetricsResponse {
    private long totalOrders;
    private long processingOrders;
    private long deliveredRevenue;
    private long totalPayments;
    private long paidPayments;
    private long totalProducts;
    private long activeProducts;
    private long lowStockProducts;
    private long totalCustomers;
    private long activeCustomers;
    private long totalCategories;
    private long rootCategories;
}
