package com.project.ecommerce.modules.payment.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.payment.service.SepayCheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments/sepay")
@RequiredArgsConstructor
@Tag(name = "SePay Webhook", description = "SePay webhook receiver")
public class SepayWebhookController {

    private final SepayCheckoutService sepayCheckoutService;

    @Operation(summary = "Receive SePay payment webhook")
    @PostMapping("/webhook")
    public ApiResponse<Void> receiveWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-Secret-Key", required = false) String secretKey) {
        sepayCheckoutService.handleWebhook(payload, secretKey);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Webhook received")
                .build();
    }
}
