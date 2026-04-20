package com.project.ecommerce.modules.payment.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.payment.dto.request.CreatePaymentTransactionRequest;
import com.project.ecommerce.modules.payment.dto.request.UpdatePaymentTransactionRequest;
import com.project.ecommerce.modules.payment.dto.response.PaymentTransactionResponse;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import com.project.ecommerce.modules.payment.service.PaymentTransactionService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Controller", description = "APIs for payment transactions and reconciliation")
public class PaymentTransactionController {

    private final PaymentTransactionService paymentTransactionService;

    @Operation(summary = "Get all payment transactions with dynamic filter + pagination")
    @GetMapping
    public ApiResponse<PageResponse<PaymentTransactionResponse>> getPayments(
            Pageable pageable,
            @Filter Specification<PaymentTransaction> spec) {
        return ApiResponse.<PageResponse<PaymentTransactionResponse>>builder()
                .code(1000)
                .message("Success")
                .result(paymentTransactionService.getPayments(pageable, spec))
                .build();
    }

    @Operation(summary = "Get payment transaction by ID")
    @GetMapping("/{id}")
    public ApiResponse<PaymentTransactionResponse> getById(@PathVariable String id) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .message("Success")
                .result(paymentTransactionService.getById(id))
                .build();
    }

    @Operation(summary = "Create payment transaction")
    @PostMapping
    public ApiResponse<PaymentTransactionResponse> create(
            @Valid @RequestBody CreatePaymentTransactionRequest request) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .message("Payment transaction created")
                .result(paymentTransactionService.create(request))
                .build();
    }

    @Operation(summary = "Update payment transaction status")
    @PatchMapping("/{id}")
    public ApiResponse<PaymentTransactionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdatePaymentTransactionRequest request) {
        return ApiResponse.<PaymentTransactionResponse>builder()
                .code(1000)
                .message("Payment transaction updated")
                .result(paymentTransactionService.update(id, request))
                .build();
    }

    @Operation(summary = "Soft delete payment transaction")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        paymentTransactionService.delete(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Payment transaction deleted")
                .build();
    }
}
