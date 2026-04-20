package com.project.ecommerce.modules.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStockAlertResponse {
    private String id;
    private String name;
    private long totalStock;
    private long totalVariants;
}
