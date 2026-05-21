package com.project.ecommerce.modules.order.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.order.dto.request.ConfirmOrderCancelRequest;
import com.project.ecommerce.modules.order.dto.request.CreateOrderRequest;
import com.project.ecommerce.modules.order.dto.request.UpdateOrderReceiverRequest;
import com.project.ecommerce.modules.order.dto.request.UpdateOrderStatusRequest;
import com.project.ecommerce.modules.order.dto.response.OrderListResponse;
import com.project.ecommerce.modules.order.dto.response.OrderResponse;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.service.OrderService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Controller", description = "APIs for querying and managing orders")
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Get all orders with dynamic filter + pagination")
    @GetMapping
    public ApiResponse<PageResponse<OrderListResponse>> getOrders(
            Pageable pageable,
            @Filter Specification<Order> spec) {
        return ApiResponse.<PageResponse<OrderListResponse>>builder()
                .code(1000).message("Success")
                .result(orderService.getOrders(pageable, spec))
                .build();
    }

    @Operation(summary = "Get order detail by ID")
    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable String id) {
        return ApiResponse.<OrderResponse>builder()
                .code(1000).message("Success")
                .result(orderService.getOrderById(id))
                .build();
    }

    @Operation(summary = "Create new order")
    @PostMapping
    public ApiResponse<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .code(1000).message("Order created")
                .result(orderService.create(request))
                .build();
    }

    @Operation(summary = "Update order status")
    @PatchMapping("/{id}/status")
    public ApiResponse<OrderResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .code(1000).message("Order status updated")
                .result(orderService.updateStatus(id, request))
                .build();
    }

    @Operation(summary = "Update order receiver info")
    @PatchMapping("/{id}/receiver")
    public ApiResponse<OrderResponse> updateReceiver(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrderReceiverRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .code(1000).message("Order receiver updated")
                .result(orderService.updateReceiver(id, request))
                .build();
    }

    @Operation(summary = "Send OTP to cancel pending order")
    @PostMapping("/{id}/cancel/send-otp")
    @com.project.ecommerce.common.annotation.RateLimit(key = "order_cancel_otp", limit = 3, period = 60)
    public ApiResponse<Void> sendCancelOtp(@PathVariable String id, Authentication authentication) {
        orderService.sendCancelOtp(id, authentication.getName());
        return ApiResponse.<Void>builder()
                .code(1000).message("OTP sent successfully")
                .build();
    }

    @Operation(summary = "Confirm order cancellation with OTP")
    @PostMapping("/{id}/cancel/confirm")
    public ApiResponse<OrderResponse> confirmCancel(
            @PathVariable String id,
            @Valid @RequestBody ConfirmOrderCancelRequest request,
            Authentication authentication) {
        return ApiResponse.<OrderResponse>builder()
                .code(1000).message("Order cancelled successfully")
                .result(orderService.confirmCancel(id, authentication.getName(), request))
                .build();
    }

    @Operation(summary = "Soft delete order")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        orderService.delete(id);
        return ApiResponse.<Void>builder().code(1000).message("Order deleted").build();
    }
}
