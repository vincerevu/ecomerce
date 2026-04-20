package com.project.ecommerce.modules.report.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardResponse;
import com.project.ecommerce.modules.report.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard Controller")
public class AdminDashboardController {
    private final AdminDashboardService adminDashboardService;

    @Operation(summary = "Get admin dashboard summary")
    @GetMapping
    public ApiResponse<AdminDashboardResponse> getDashboard(Authentication authentication) {
        return ApiResponse.<AdminDashboardResponse>builder()
                .code(1000)
                .message("Success")
                .result(adminDashboardService.getDashboard(authentication))
                .build();
    }
}
