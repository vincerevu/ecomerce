package com.project.ecommerce.modules.identity.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.identity.dto.request.CreateRoleRequest;
import com.project.ecommerce.modules.identity.dto.response.RoleResponse;
import com.project.ecommerce.modules.identity.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Role Controller", description = "APIs for managing roles")
@SecurityRequirement(name = "bearerAuth")
public class RoleController {
    private final RoleService roleService;

    @Operation(summary = "Create role", description = "Creates a new role")
    @PostMapping
    public ApiResponse<RoleResponse> createRole(@RequestBody @Valid CreateRoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .code(1000)
                .message("Role created successfully")
                .result(roleService.createRole(request))
                .build();
    }

    @Operation(summary = "Get all roles", description = "Retrieves all roles")
    @GetMapping
    public ApiResponse<List<RoleResponse>> getAllRoles() {
        return ApiResponse.<List<RoleResponse>>builder()
                .code(1000)
                .message("Roles retrieved successfully")
                .result(roleService.getAllRoles())
                .build();
    }

    @Operation(summary = "Get role by name", description = "Retrieves a role by name")
    @GetMapping("/{name}")
    public ApiResponse<RoleResponse> getRoleByName(@PathVariable String name) {
        return ApiResponse.<RoleResponse>builder()
                .code(1000)
                .message("Role retrieved successfully")
                .result(roleService.getRoleById(name))
                .build();
    }

    @Operation(summary = "Update role", description = "Updates an existing role")
    @PutMapping("/{name}")
    public ApiResponse<RoleResponse> updateRole(@PathVariable String name, @RequestBody @Valid CreateRoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .code(1000)
                .message("Role updated successfully")
                .result(roleService.updateRole(name, request))
                .build();
    }

    @Operation(summary = "Delete role", description = "Deletes a role")
    @DeleteMapping("/{name}")
    public ApiResponse<Void> deleteRole(@PathVariable String name) {
        roleService.deleteRole(name);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Role deleted successfully")
                .build();
    }
}
