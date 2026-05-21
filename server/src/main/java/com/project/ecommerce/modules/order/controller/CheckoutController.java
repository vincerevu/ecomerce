package com.project.ecommerce.modules.order.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.order.dto.request.CartItemRequest;
import com.project.ecommerce.modules.order.dto.request.UpdateCartItemRequest;
import com.project.ecommerce.modules.order.dto.response.CartResponse;
import com.project.ecommerce.modules.order.service.CheckoutCartService;
import com.project.ecommerce.modules.order.dto.request.CreateOrderRequest;
import com.project.ecommerce.modules.order.dto.response.OrderResponse;
import com.project.ecommerce.modules.order.service.OrderService;
import com.project.ecommerce.modules.payment.dto.request.CreateSepayCheckoutRequest;
import com.project.ecommerce.modules.payment.dto.response.PaymentTransactionResponse;
import com.project.ecommerce.modules.payment.dto.response.SepayCheckoutResponse;
import com.project.ecommerce.modules.payment.service.PaymentTransactionService;
import com.project.ecommerce.modules.payment.service.SepayCheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
@Tag(name = "Checkout Controller", description = "Customer-facing checkout APIs")
public class CheckoutController {

    private final OrderService orderService;
    private final PaymentTransactionService paymentTransactionService;
    private final SepayCheckoutService sepayCheckoutService;
    private final CheckoutCartService checkoutCartService;

    @Operation(summary = "Create order from client checkout")
    @PostMapping("/orders")
    public ApiResponse<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        String userId = extractUserId(authentication);
        OrderResponse result = orderService.createForCheckout(request, userId);
        if (userId != null) {
            checkoutCartService.clearCartSilently(userId);
        }
        return ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Order created successfully")
                .result(result)
                .build();
    }

    @Operation(summary = "Get authenticated user's cart")
    @GetMapping("/cart")
    public ApiResponse<CartResponse> getCart(Authentication authentication) {
        return ApiResponse.<CartResponse>builder()
                .code(1000)
                .message("Cart fetched successfully")
                .result(checkoutCartService.getMyCart(extractRequiredUserId(authentication)))
                .build();
    }

    @Operation(summary = "Add item to authenticated user's cart")
    @PostMapping("/cart/items")
    public ApiResponse<CartResponse> addCartItem(
            @Valid @RequestBody CartItemRequest request,
            Authentication authentication) {
        return ApiResponse.<CartResponse>builder()
                .code(1000)
                .message("Cart item added successfully")
                .result(checkoutCartService.addItem(extractRequiredUserId(authentication), request))
                .build();
    }

    @Operation(summary = "Update item in authenticated user's cart")
    @PutMapping("/cart/items/{itemId}")
    public ApiResponse<CartResponse> updateCartItem(
            @PathVariable String itemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {
        return ApiResponse.<CartResponse>builder()
                .code(1000)
                .message("Cart item updated successfully")
                .result(checkoutCartService.updateItem(extractRequiredUserId(authentication), itemId, request))
                .build();
    }

    @Operation(summary = "Remove item from authenticated user's cart")
    @DeleteMapping("/cart/items/{itemId}")
    public ApiResponse<CartResponse> removeCartItem(@PathVariable String itemId, Authentication authentication) {
        return ApiResponse.<CartResponse>builder()
                .code(1000)
                .message("Cart item removed successfully")
                .result(checkoutCartService.removeItem(extractRequiredUserId(authentication), itemId))
                .build();
    }

    @Operation(summary = "Clear authenticated user's cart")
    @DeleteMapping("/cart/items")
    public ApiResponse<CartResponse> clearCart(Authentication authentication) {
        return ApiResponse.<CartResponse>builder()
                .code(1000)
                .message("Cart cleared successfully")
                .result(checkoutCartService.clearCart(extractRequiredUserId(authentication)))
                .build();
    }

    @Operation(summary = "Create COD payment transaction from client checkout")
    @PostMapping("/payments/cod/{orderId}")
    public ApiResponse<PaymentTransactionResponse> createCodPayment(@PathVariable String orderId) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .message("COD payment created successfully")
                .result(paymentTransactionService.createCodForCheckout(orderId))
                .build();
    }

    @Operation(summary = "Create SePay payment checkout from client checkout")
    @PostMapping("/payments/sepay")
    public ApiResponse<SepayCheckoutResponse> createSepayCheckout(
            @Valid @RequestBody CreateSepayCheckoutRequest request) {
        return ApiResponse.<SepayCheckoutResponse>builder()
                .code(1000)
                .message("SePay checkout created successfully")
                .result(sepayCheckoutService.createCheckout(request.getOrderId()))
                .build();
    }

    @Operation(summary = "Sync SePay payment status")
    @GetMapping("/payments/sepay/{paymentId}")
    public ApiResponse<SepayCheckoutResponse> syncSepayCheckout(@PathVariable String paymentId) {
        return ApiResponse.<SepayCheckoutResponse>builder()
                .code(1000)
                .message("SePay checkout synced successfully")
                .result(sepayCheckoutService.syncCheckout(paymentId))
                .build();
    }

    private String extractUserId(Authentication authentication) {
        String userId = authentication != null ? authentication.getName() : null;
        if ("anonymousUser".equals(userId)) {
            return null;
        }
        return userId;
    }

    private String extractRequiredUserId(Authentication authentication) {
        String userId = extractUserId(authentication);
        if (userId == null) {
            throw new com.project.ecommerce.common.exceptions.AppException(
                    com.project.ecommerce.common.exceptions.ErrorCode.UNAUTHENTICATED);
        }
        return userId;
    }
}
