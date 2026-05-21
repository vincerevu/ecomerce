package com.project.ecommerce.modules.content.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.content.dto.request.AppSettingRequest;
import com.project.ecommerce.modules.content.dto.response.AppSettingResponse;
import com.project.ecommerce.modules.content.service.AppSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
@Tag(name = "App Setting Controller", description = "APIs for managing dynamic system configurations")
public class AppSettingController {
    private final AppSettingService appSettingService;

    @Operation(summary = "Admin: Get all system settings")
    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<AppSettingResponse>> getAll() {
        return ApiResponse.<List<AppSettingResponse>>builder()
                .code(1000)
                .message("Success")
                .result(appSettingService.getAllSettings())
                .build();
    }

    @Operation(summary = "Get setting value by key")
    @GetMapping("/{key}")
    public ApiResponse<String> getSetting(@PathVariable String key, @RequestParam(required = false) String defaultValue) {
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Success")
                .result(appSettingService.getSetting(key, defaultValue))
                .build();
    }

    @Operation(summary = "Admin: Update or create setting")
    @PutMapping("/{key}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AppSettingResponse> update(
            @PathVariable String key,
            @RequestBody @Valid AppSettingRequest request) {
        return ApiResponse.<AppSettingResponse>builder()
                .code(1000)
                .message("Setting updated successfully")
                .result(appSettingService.updateSetting(key, request))
                .build();
    }
}
