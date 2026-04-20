package com.project.ecommerce.modules.identity.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.identity.dto.response.PointHistoryResponse;
import com.project.ecommerce.modules.identity.service.PointHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/points")
@RequiredArgsConstructor
@Tag(name = "Point History Controller", description = "APIs for managing user points")
@SecurityRequirement(name = "bearerAuth")
public class PointHistoryController {
    private final PointHistoryService pointHistoryService;

    @Operation(summary = "Get point history", description = "Retrieves point history for the authenticated user")
    @GetMapping("/history")
    public ApiResponse<List<PointHistoryResponse>> getUserPointHistory(Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.<List<PointHistoryResponse>>builder()
                .code(1000)
                .message("Point history retrieved successfully")
                .result(pointHistoryService.getUserPointHistory(userId))
                .build();
    }
}
