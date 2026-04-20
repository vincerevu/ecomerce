package com.project.ecommerce.modules.shipping.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.shipping.dto.request.AvailableShippingServiceRequest;
import com.project.ecommerce.modules.shipping.dto.request.CreateShipmentRequest;
import com.project.ecommerce.modules.shipping.dto.request.EstimateShippingFeeRequest;
import com.project.ecommerce.modules.shipping.dto.response.ShipmentResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingAddressOptionResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingFeeResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingServiceOptionResponse;
import com.project.ecommerce.modules.shipping.entity.Shipment;
import com.project.ecommerce.modules.shipping.service.ShipmentService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/shipments")
@RequiredArgsConstructor
@Tag(name = "Shipment Controller", description = "APIs for shipping, GHN sandbox integration and tracking")
public class ShipmentController {

    private final ShipmentService shipmentService;

    @Operation(summary = "Get all shipments with dynamic filter and pagination")
    @GetMapping
    public ApiResponse<PageResponse<ShipmentResponse>> getShipments(
            Pageable pageable,
            @Filter Specification<Shipment> spec) {
        return ApiResponse.<PageResponse<ShipmentResponse>>builder()
                .code(1000)
                .message("Success")
                .result(shipmentService.getShipments(pageable, spec))
                .build();
    }

    @Operation(summary = "Get shipment by ID")
    @GetMapping("/{id}")
    public ApiResponse<ShipmentResponse> getById(@PathVariable String id) {
        return ApiResponse.<ShipmentResponse>builder()
                .code(1000)
                .message("Success")
                .result(shipmentService.getById(id))
                .build();
    }

    @Operation(summary = "Get shipment by order ID")
    @GetMapping("/by-order/{orderId}")
    public ApiResponse<ShipmentResponse> getByOrderId(@PathVariable String orderId) {
        return ApiResponse.<ShipmentResponse>builder()
                .code(1000)
                .message("Success")
                .result(shipmentService.getByOrderId(orderId))
                .build();
    }

    @Operation(summary = "Estimate GHN shipping fee")
    @PostMapping("/fee-estimates")
    public ApiResponse<ShippingFeeResponse> estimateFee(@Valid @RequestBody EstimateShippingFeeRequest request) {
        return ApiResponse.<ShippingFeeResponse>builder()
                .code(1000)
                .message("Shipping fee estimated")
                .result(shipmentService.estimateFee(request))
                .build();
    }

    @Operation(summary = "Get available GHN services")
    @PostMapping("/services")
    public ApiResponse<List<ShippingServiceOptionResponse>> getAvailableServices(
            @Valid @RequestBody AvailableShippingServiceRequest request) {
        return ApiResponse.<List<ShippingServiceOptionResponse>>builder()
                .code(1000)
                .message("Available services fetched")
                .result(shipmentService.getAvailableServices(request))
                .build();
    }

    @Operation(summary = "Create shipment for an order")
    @PostMapping
    public ApiResponse<ShipmentResponse> createShipment(@Valid @RequestBody CreateShipmentRequest request) {
        return ApiResponse.<ShipmentResponse>builder()
                .code(1000)
                .message("Shipment created")
                .result(shipmentService.createShipment(request))
                .build();
    }

    @Operation(summary = "Receive GHN shipment status webhook")
    @PostMapping("/webhooks/ghn/status")
    public ApiResponse<Void> receiveGhnStatusWebhook(@RequestBody Map<String, Object> payload) {
        shipmentService.handleGhnStatusWebhook(payload);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Webhook received")
                .build();
    }

    @Operation(summary = "Sync shipment status from GHN")
    @PatchMapping("/{id}/sync")
    public ApiResponse<ShipmentResponse> syncShipment(@PathVariable String id) {
        return ApiResponse.<ShipmentResponse>builder()
                .code(1000)
                .message("Shipment synced")
                .result(shipmentService.syncShipment(id))
                .build();
    }

    @Operation(summary = "Cancel shipment on GHN")
    @PatchMapping("/{id}/cancel")
    public ApiResponse<ShipmentResponse> cancelShipment(@PathVariable String id) {
        return ApiResponse.<ShipmentResponse>builder()
                .code(1000)
                .message("Shipment cancelled")
                .result(shipmentService.cancelShipment(id))
                .build();
    }

    @Operation(summary = "Soft delete shipment")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteShipment(@PathVariable String id) {
        shipmentService.deleteShipment(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Shipment deleted")
                .build();
    }

    @Operation(summary = "Get GHN provinces")
    @GetMapping("/locations/provinces")
    public ApiResponse<List<ShippingAddressOptionResponse>> getProvinces() {
        return ApiResponse.<List<ShippingAddressOptionResponse>>builder()
                .code(1000)
                .message("Provinces fetched")
                .result(shipmentService.getProvinces())
                .build();
    }

    @Operation(summary = "Get GHN districts by province")
    @GetMapping("/locations/districts")
    public ApiResponse<List<ShippingAddressOptionResponse>> getDistricts(@RequestParam Integer provinceId) {
        return ApiResponse.<List<ShippingAddressOptionResponse>>builder()
                .code(1000)
                .message("Districts fetched")
                .result(shipmentService.getDistricts(provinceId))
                .build();
    }

    @Operation(summary = "Get GHN wards by district")
    @GetMapping("/locations/wards")
    public ApiResponse<List<ShippingAddressOptionResponse>> getWards(@RequestParam Integer districtId) {
        return ApiResponse.<List<ShippingAddressOptionResponse>>builder()
                .code(1000)
                .message("Wards fetched")
                .result(shipmentService.getWards(districtId))
                .build();
    }
}
