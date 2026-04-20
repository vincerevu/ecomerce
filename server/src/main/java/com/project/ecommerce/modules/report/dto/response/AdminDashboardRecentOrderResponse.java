package com.project.ecommerce.modules.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardRecentOrderResponse {
    private String id;
    private String orderCode;
    private String customerName;
    private int itemCount;
    private String status;
    private long totalAmount;
    private LocalDateTime createdAt;
}
