package com.project.ecommerce.modules.identity.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.identity.dto.request.CreateUserRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateUserProfileRequest;
import com.project.ecommerce.modules.identity.dto.response.UserResponse;
import com.project.ecommerce.modules.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.identity.entity.User;
import com.turkraft.springfilter.boot.Filter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Controller", description = "APIs for managing users")
public class UserController {
        private final UserService userService;

        @Operation(summary = "Create a new user", description = "Creates a new user with the provided details")
        @PostMapping
        ApiResponse<UserResponse> createUser(@RequestBody @Valid CreateUserRequest request) {
                return ApiResponse.<UserResponse>builder()
                                .code(1000)
                                .message("Create user successfully")
                                .result(userService.createUser(request))
                                .build();
        }

        @Operation(summary = "Get list of users", description = "Retrieves a paginated list of users")
        @GetMapping
        ApiResponse<PageResponse<UserResponse>> getUsers(
                        @Filter Specification<User> spec,
                        Pageable pageable) {
                return ApiResponse.<PageResponse<UserResponse>>builder()
                                .code(1000)
                                .message("Users retrieved successfully")
                                .result(userService.getUsers(spec, pageable))
                                .build();
        }

        @Operation(summary = "Get user by id", description = "Retrieves details of a user by ID")
        @GetMapping("/{id}")
        ApiResponse<UserResponse> getUserById(@PathVariable String id) {
                return ApiResponse.<UserResponse>builder()
                                .result(userService.getUserByid(id))
                                .build();
        }

        @Operation(summary = "Update user profile", description = "Updates authenticated user's profile information")
        @PutMapping("/profile")
        ApiResponse<UserResponse> updateProfile(
                        @RequestBody @Valid UpdateUserProfileRequest request,
                        Authentication authentication) {
                String userId = authentication.getName();
                return ApiResponse.<UserResponse>builder()
                                .code(1000)
                                .message("Profile updated successfully")
                                .result(userService.updateProfile(userId, request))
                                .build();
        }

        @Operation(summary = "Admin update user", description = "Admin updates any user profile and roles")
        @PutMapping("/{id}")
        ApiResponse<UserResponse> updateUser(
                        @PathVariable String id,
                        @RequestBody @Valid CreateUserRequest request) {
                return ApiResponse.<UserResponse>builder()
                                .code(1000)
                                .message("User updated successfully")
                                .result(userService.updateUser(id, request))
                                .build();
        }

        @Operation(summary = "Admin delete user", description = "Admin deletes any user")
        @DeleteMapping("/{id}")
        ApiResponse<Void> deleteUser(@PathVariable String id) {
                userService.deleteUser(id);
                return ApiResponse.<Void>builder()
                                .code(1000)
                                .message("User deleted successfully")
                                .build();
        }

        @Operation(summary = "Get current user info", description = "Retrieves information of the authenticated user")
        @GetMapping("/my-info")
        ApiResponse<UserResponse> getMyInfo(Authentication authentication) {
                String userId = authentication.getName();
                return ApiResponse.<UserResponse>builder()
                                .code(1000)
                                .result(userService.getUserByid(userId))
                                .build();
        }

        @Operation(summary = "Get list of staff", description = "Retrieves a paginated list of staff members")
        @GetMapping("/staff")
        ApiResponse<PageResponse<UserResponse>> getStaff(
                        @Filter Specification<User> spec,
                        Pageable pageable) {
                return ApiResponse.<PageResponse<UserResponse>>builder()
                                .code(1000)
                                .message("Staff retrieved successfully")
                                .result(userService.getStaff(spec, pageable))
                                .build();
        }

        @Operation(summary = "Get list of customers", description = "Retrieves a paginated list of customers")
        @GetMapping("/customers")
        ApiResponse<PageResponse<UserResponse>> getCustomers(
                        @Filter Specification<User> spec,
                        Pageable pageable) {
                return ApiResponse.<PageResponse<UserResponse>>builder()
                                .code(1000)
                                .message("Customers retrieved successfully")
                                .result(userService.getCustomers(spec, pageable))
                                .build();
        }

        @Operation(summary = "Update user active status", description = "Activates or blocks a user account")
        @PatchMapping("/{id}/active")
        ApiResponse<UserResponse> updateUserActiveStatus(
                        @PathVariable String id,
                        @RequestParam boolean active) {
                return ApiResponse.<UserResponse>builder()
                                .code(1000)
                                .message("User status updated successfully")
                                .result(userService.updateUserActiveStatus(id, active))
                                .build();
        }

        @Operation(summary = "Get list of staff positions", description = "Retrieves a set of unique positions held by staff members")
        @GetMapping("/staff/positions")
        ApiResponse<java.util.Set<String>> getStaffPositions() {
                return ApiResponse.<java.util.Set<String>>builder()
                                .code(1000)
                                .message("Staff positions retrieved successfully")
                                .result(userService.getAllStaffPositions())
                                .build();
        }
}
