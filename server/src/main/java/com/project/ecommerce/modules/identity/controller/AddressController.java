package com.project.ecommerce.modules.identity.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.identity.dto.request.CreateAddressRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateAddressRequest;
import com.project.ecommerce.modules.identity.dto.response.AddressResponse;
import com.project.ecommerce.modules.identity.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
@Tag(name = "Address Controller", description = "APIs for managing user addresses")
@SecurityRequirement(name = "bearerAuth")
public class AddressController {
    private final AddressService addressService;

    @Operation(summary = "Create a new address", description = "Creates a new address for the authenticated user")
    @PostMapping
    public ApiResponse<AddressResponse> createAddress(
            @RequestBody @Valid CreateAddressRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.<AddressResponse>builder()
                .code(1000)
                .message("Address created successfully")
                .result(addressService.createAddress(userId, request))
                .build();
    }

    @Operation(summary = "Get all addresses", description = "Retrieves all addresses of the authenticated user")
    @GetMapping
    public ApiResponse<List<AddressResponse>> getUserAddresses(Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.<List<AddressResponse>>builder()
                .code(1000)
                .message("Addresses retrieved successfully")
                .result(addressService.getUserAddresses(userId))
                .build();
    }

    @Operation(summary = "Get addresses by user id for admin", description = "Retrieves addresses of a specific user for admin order operations")
    @GetMapping("/admin/users/{userId}")
    public ApiResponse<List<AddressResponse>> getAddressesForAdmin(@PathVariable String userId) {
        return ApiResponse.<List<AddressResponse>>builder()
                .code(1000)
                .message("Addresses retrieved successfully")
                .result(addressService.getAddressesForAdmin(userId))
                .build();
    }

    @Operation(summary = "Get address by id", description = "Retrieves a specific address by ID")
    @GetMapping("/{addressId}")
    public ApiResponse<AddressResponse> getAddressById(
            @PathVariable String addressId,
            Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.<AddressResponse>builder()
                .code(1000)
                .message("Address retrieved successfully")
                .result(addressService.getAddressById(userId, addressId))
                .build();
    }

    @Operation(summary = "Update address", description = "Updates an existing address")
    @PutMapping("/{addressId}")
    public ApiResponse<AddressResponse> updateAddress(
            @PathVariable String addressId,
            @RequestBody @Valid UpdateAddressRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.<AddressResponse>builder()
                .code(1000)
                .message("Address updated successfully")
                .result(addressService.updateAddress(userId, addressId, request))
                .build();
    }

    @Operation(summary = "Delete address", description = "Deletes an address")
    @DeleteMapping("/{addressId}")
    public ApiResponse<Void> deleteAddress(
            @PathVariable String addressId,
            Authentication authentication) {
        String userId = authentication.getName();
        addressService.deleteAddress(userId, addressId);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Address deleted successfully")
                .build();
    }
}
