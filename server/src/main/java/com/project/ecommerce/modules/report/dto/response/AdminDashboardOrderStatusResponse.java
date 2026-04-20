package com.project.ecommerce.modules.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardOrderStatusResponse {
    private String label;
    private long count;
    private long percent;
    private String barClass;
}
