package com.project.ecommerce.modules.identity.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.identity.dto.request.CreatePermissionRequest;
import com.project.ecommerce.modules.identity.dto.response.PermissionResponse;
import com.project.ecommerce.modules.identity.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
@Tag(name = "Permission Controller", description = "APIs for managing permissions")
@SecurityRequirement(name = "bearerAuth")
public class PermissionController {
    private final PermissionService permissionService;

    @Operation(summary = "Create permission", description = "Creates a new permission")
    @PostMapping
    public ApiResponse<PermissionResponse> createPermission(@RequestBody @Valid CreatePermissionRequest request) {
        return ApiResponse.<PermissionResponse>builder()
                .code(1000)
                .message("Permission created successfully")
                .result(permissionService.createPermission(request))
                .build();
    }

    @Operation(summary = "Get all permissions", description = "Retrieves all permissions")
    @GetMapping
    public ApiResponse<List<PermissionResponse>> getAllPermissions() {
        return ApiResponse.<List<PermissionResponse>>builder()
                .code(1000)
                .message("Permissions retrieved successfully")
                .result(permissionService.getAllPermissions())
                .build();
    }

    @Operation(summary = "Get permission by id", description = "Retrieves a permission by ID")
    @GetMapping("/{id}")
    public ApiResponse<PermissionResponse> getPermissionById(@PathVariable String id) {
        return ApiResponse.<PermissionResponse>builder()
                .code(1000)
                .message("Permission retrieved successfully")
                .result(permissionService.getPermissionById(id))
                .build();
    }

    @Operation(summary = "Delete permission", description = "Deletes a permission")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePermission(@PathVariable String id) {
        permissionService.deletePermission(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Permission deleted successfully")
                .build();
    }
}
