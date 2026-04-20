package com.project.ecommerce.modules.identity.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.identity.dto.request.CreateMembershipTierRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateMembershipTierRequest;
import com.project.ecommerce.modules.identity.dto.response.MembershipTierResponse;
import com.project.ecommerce.modules.identity.service.MembershipTierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/membership-tiers")
@RequiredArgsConstructor
@Tag(name = "Membership Tier Controller", description = "APIs for managing membership tiers")
@SecurityRequirement(name = "bearerAuth")
public class MembershipTierController {
    private final MembershipTierService membershipTierService;

    @Operation(summary = "Create membership tier", description = "Creates a new membership tier")
    @PostMapping
    public ApiResponse<MembershipTierResponse> createMembershipTier(@RequestBody @Valid CreateMembershipTierRequest request) {
        return ApiResponse.<MembershipTierResponse>builder()
                .code(1000)
                .message("Membership tier created successfully")
                .result(membershipTierService.createMembershipTier(request))
                .build();
    }

    @Operation(summary = "Get all membership tiers", description = "Retrieves all membership tiers")
    @GetMapping
    public ApiResponse<List<MembershipTierResponse>> getAllMembershipTiers() {
        return ApiResponse.<List<MembershipTierResponse>>builder()
                .code(1000)
                .message("Membership tiers retrieved successfully")
                .result(membershipTierService.getAllMembershipTiers())
                .build();
    }

    @Operation(summary = "Get membership tier by id", description = "Retrieves a membership tier by ID")
    @GetMapping("/{id}")
    public ApiResponse<MembershipTierResponse> getMembershipTierById(@PathVariable String id) {
        return ApiResponse.<MembershipTierResponse>builder()
                .code(1000)
                .message("Membership tier retrieved successfully")
                .result(membershipTierService.getMembershipTierById(id))
                .build();
    }

    @Operation(summary = "Update membership tier", description = "Updates a membership tier")
    @PutMapping("/{id}")
    public ApiResponse<MembershipTierResponse> updateMembershipTier(
            @PathVariable String id,
            @RequestBody @Valid UpdateMembershipTierRequest request) {
        return ApiResponse.<MembershipTierResponse>builder()
                .code(1000)
                .message("Membership tier updated successfully")
                .result(membershipTierService.updateMembershipTier(id, request))
                .build();
    }

    @Operation(summary = "Delete membership tier", description = "Deletes a membership tier")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteMembershipTier(@PathVariable String id) {
        membershipTierService.deleteMembershipTier(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Membership tier deleted successfully")
                .build();
    }
}
