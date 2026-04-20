package com.project.ecommerce.modules.payment.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.payment.config.SepayProperties;
import com.project.ecommerce.modules.payment.dto.response.PaymentTransactionResponse;
import com.project.ecommerce.modules.payment.dto.response.SepayCheckoutResponse;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import com.project.ecommerce.modules.payment.enums.PaymentMethod;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.enums.PaymentTransactionType;
import com.project.ecommerce.modules.payment.repository.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class SepayCheckoutService {

    private final SepayProperties sepayProperties;
    private final OrderRepository orderRepository;
    private final PaymentTransactionService paymentTransactionService;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Transactional
    public SepayCheckoutResponse createCheckout(String orderId) {
        validateConfig();

        Order order = resolveOrder(orderId);
        ensureOrderIsPayable(order);

        PaymentTransaction reusablePayment = findLatestSepayCharge(order)
                .filter(payment -> payment.getStatus() == PaymentStatus.PENDING)
                .orElse(null);
        LocalDateTime expiredAt = resolveOrderExpiredAt(order);
        BigDecimal amount = resolveCheckoutAmount();
        if (reusablePayment != null) {
            Map<String, Object> response = buildLocalSepayPayload(order, amount, expiredAt);
            return buildCheckoutResponse(order, reusablePayment, response, expiredAt, amount);
        }

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.FIELD_REQUIRED);
        }

        Map<String, Object> response = buildLocalSepayPayload(order, amount, expiredAt);
        String providerReference = order.getOrderCode();

        PaymentTransactionResponse payment = paymentTransactionService.createForCheckout(
                order,
                PaymentProvider.SEPAY,
                PaymentMethod.BANK_TRANSFER,
                PaymentStatus.PENDING,
                amount,
                providerReference,
                "SePay QR transfer checkout",
                response);

        return buildCheckoutResponse(order, payment, response, expiredAt);
    }

    @Transactional
    public SepayCheckoutResponse syncCheckout(String paymentId) {
        PaymentTransaction payment = paymentTransactionService.findEntityById(paymentId);
        Order order = payment.getOrder();
        expireOrderIfNeeded(order);
        payment = paymentTransactionService.findEntityById(paymentId);
        order = payment.getOrder();
        BigDecimal amount = resolveCheckoutAmount();
        LocalDateTime expiredAt = resolveOrderExpiredAt(order);
        Map<String, Object> response = buildLocalSepayPayload(
                order,
                amount,
                expiredAt);
        return buildCheckoutResponse(order, payment, response, parseDateTime(response.get("expired_at")), amount);
    }

    @Transactional
    public void handleWebhook(Map<String, Object> payload, String secretKey) {
        validateWebhookSecret(secretKey);

        Map<String, Object> result = unwrapSepayResult(payload);
        PaymentTransaction payment = resolveWebhookPayment(result).orElse(null);
        if (payment == null) {
            return;
        }

        PaymentStatus paymentStatus = resolvePaymentStatus(result);
        Order order = payment.getOrder();
        expireOrderIfNeeded(order);
        payment = paymentTransactionService.findEntityById(payment.getId());
        String providerReference = stringify(firstNonNull(
                result.get("payment_reference"),
                result.get("transaction_id"),
                result.get("reference_code"),
                result.get("order_code"),
                result.get("orderCode"),
                payment.getProviderReference()));

        if (paymentStatus == PaymentStatus.PAID && !isOrderPayable(payment.getOrder())) {
            paymentTransactionService.updateForCheckout(payment.getId(), PaymentStatus.FAILED, payload, providerReference);
            return;
        }

        paymentTransactionService.updateForCheckout(payment.getId(), paymentStatus, payload, providerReference);
    }

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void cancelExpiredPendingOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(sepayProperties.getExpiredMinutes());
        List<Order> expiredOrders = orderRepository.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, cutoff);
        for (Order order : expiredOrders) {
            expireOrderIfNeeded(order);
        }
    }

    private SepayCheckoutResponse buildCheckoutResponse(
            Order order,
            PaymentTransactionResponse payment,
            Map<String, Object> result,
            LocalDateTime expiredAt) {
        BigDecimal amount = resolveCheckoutAmount();
        return SepayCheckoutResponse.builder()
                .paymentId(payment.getId())
                .transactionCode(payment.getTransactionCode())
                .providerReference(payment.getProviderReference())
                .paymentStatus(payment.getStatus())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .amount(amount)
                .bankName(stringify(firstNonNull(result.get("bank_name"), result.get("bank_short_name"), result.get("bankCode"))))
                .bankCode(stringify(firstNonNull(result.get("bank_code"), result.get("bankBin"))))
                .bankAccountNumber(stringify(firstNonNull(
                        result.get("account_number"),
                        result.get("bank_account_number"),
                        result.get("virtual_account"),
                        sepayProperties.getBankAccountNumber())))
                .accountHolderName(stringify(firstNonNull(result.get("account_holder_name"), result.get("account_name"))))
                .qrCode(stringify(firstNonNull(result.get("qr_code"), result.get("qr_content"))))
                .qrImageUrl(stringify(firstNonNull(result.get("qr_image_url"), result.get("qr_code_url"))))
                .checkoutUrl(stringify(firstNonNull(result.get("checkout_url"), result.get("payment_url"))))
                .expiredAt(expiredAt)
                .build();
    }

    private SepayCheckoutResponse buildCheckoutResponse(
            Order order,
            PaymentTransaction payment,
            Map<String, Object> result,
            LocalDateTime expiredAt,
            BigDecimal amount) {
        return SepayCheckoutResponse.builder()
                .paymentId(payment.getId())
                .transactionCode(payment.getTransactionCode())
                .providerReference(payment.getProviderReference())
                .paymentStatus(payment.getStatus())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .amount(amount)
                .bankName(stringify(firstNonNull(result.get("bank_name"), result.get("bank_short_name"), result.get("bankCode"))))
                .bankCode(stringify(firstNonNull(result.get("bank_code"), result.get("bankBin"))))
                .bankAccountNumber(stringify(firstNonNull(
                        result.get("account_number"),
                        result.get("bank_account_number"),
                        result.get("virtual_account"),
                        sepayProperties.getBankAccountNumber())))
                .accountHolderName(stringify(firstNonNull(result.get("account_holder_name"), result.get("account_name"))))
                .qrCode(stringify(firstNonNull(result.get("qr_code"), result.get("qr_content"))))
                .qrImageUrl(stringify(firstNonNull(result.get("qr_image_url"), result.get("qr_code_url"))))
                .checkoutUrl(stringify(firstNonNull(result.get("checkout_url"), result.get("payment_url"))))
                .expiredAt(expiredAt)
                .build();
    }

    private java.util.Optional<PaymentTransaction> resolveWebhookPayment(Map<String, Object> result) {
        String providerReference = stringify(firstNonNull(
                result.get("reference_code"),
                result.get("order_code"),
                result.get("orderCode"),
                result.get("order_id"),
                result.get("id"),
                result.get("code")));
        if (StringUtils.hasText(providerReference)) {
            var byProviderReference = paymentTransactionRepository
                    .findFirstByProviderAndProviderReferenceOrderByCreatedAtDesc(PaymentProvider.SEPAY, providerReference);
            if (byProviderReference.isPresent()) {
                return byProviderReference;
            }
            var byOrderCode = paymentTransactionRepository
                    .findFirstByProviderAndOrder_OrderCodeOrderByCreatedAtDesc(PaymentProvider.SEPAY, providerReference);
            if (byOrderCode.isPresent()) {
                return byOrderCode;
            }
        }

        String transactionCode = stringify(result.get("transaction_code"));
        if (StringUtils.hasText(transactionCode)) {
            return paymentTransactionRepository.findByTransactionCode(transactionCode);
        }
        return java.util.Optional.empty();
    }

    private Map<String, Object> unwrapSepayResult(Map<String, Object> response) {
        if (response == null || response.isEmpty()) {
            throw new AppException(ErrorCode.PAYMENT_PROVIDER_ERROR);
        }

        Object result = firstNonNull(response.get("result"), response.get("data"));
        if (result instanceof Map<?, ?> map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> typedMap = (Map<String, Object>) map;
            return typedMap;
        }
        return response;
    }

    private PaymentStatus resolvePaymentStatus(Map<String, Object> result) {
        String rawStatus = stringify(firstNonNull(
                result.get("payment_status"),
                result.get("status"),
                result.get("order_status"),
                result.get("transaction_status")));
        String normalized = rawStatus == null ? "" : rawStatus.trim().toUpperCase();

        if (normalized.contains("PAID") || normalized.contains("SUCCESS") || normalized.contains("COMPLETED")) {
            return PaymentStatus.PAID;
        }
        if (normalized.contains("FAIL") || normalized.contains("CANCEL") || normalized.contains("EXPIRE")) {
            return PaymentStatus.FAILED;
        }
        return PaymentStatus.PENDING;
    }

    private Map<String, Object> buildLocalSepayPayload(Order order, BigDecimal amount, LocalDateTime expiredAt) {
        Map<String, Object> result = new LinkedHashMap<>();
        String orderCode = order.getOrderCode();
        String bankCode = stringify(firstNonNull(sepayProperties.getBankCode(), sepayProperties.getBankBin(), "MBBank"));
        String accountNumber = sepayProperties.getBankAccountNumber();
        String qrContent = buildTransferContent(orderCode);
        String qrImageUrl = buildSepayQrImageUrl(accountNumber, bankCode, amount, qrContent);

        result.put("id", orderCode);
        result.put("reference_code", orderCode);
        result.put("code", orderCode);
        result.put("amount", amount);
        result.put("bank_name", bankCode);
        result.put("bank_short_name", bankCode);
        result.put("bank_code", bankCode);
        result.put("bankBin", bankCode);
        result.put("account_number", accountNumber);
        result.put("bank_account_number", accountNumber);
        result.put("account_holder_name", "Bagy Fashion");
        result.put("account_name", "Bagy Fashion");
        result.put("qr_code", qrContent);
        result.put("qr_content", qrContent);
        result.put("qr_image_url", qrImageUrl);
        result.put("qr_code_url", qrImageUrl);
        result.put("checkout_url", qrImageUrl);
        result.put("payment_url", qrImageUrl);
        result.put("expired_at", expiredAt);
        result.put("status", "PENDING");
        return result;
    }

    private String buildTransferContent(String orderCode) {
        return stringify(orderCode);
    }

    private BigDecimal resolveCheckoutAmount() {
        return BigDecimal.valueOf(sepayProperties.getTestAmount() != null ? sepayProperties.getTestAmount() : 2000);
    }

    private Order resolveOrder(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private LocalDateTime resolveOrderExpiredAt(Order order) {
        LocalDateTime createdAt = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
        return createdAt.plusMinutes(sepayProperties.getExpiredMinutes());
    }

    private boolean isExpired(Order order) {
        return resolveOrderExpiredAt(order).isBefore(LocalDateTime.now());
    }

    private boolean isOrderPayable(Order order) {
        if (order.getStatus() != OrderStatus.PENDING) {
            return false;
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.REFUNDED) {
            return false;
        }
        return !isExpired(order);
    }

    private void ensureOrderIsPayable(Order order) {
        if (isExpired(order)) {
            expireOrderPayment(order);
            throw new AppException(ErrorCode.ORDER_PAYMENT_EXPIRED);
        }
        if (!isOrderPayable(order)) {
            throw new AppException(ErrorCode.ORDER_PAYMENT_NOT_ALLOWED);
        }
    }

    private void expireOrderIfNeeded(Order order) {
        if (!shouldExpireOrder(order)) {
            return;
        }
        expireOrderPayment(order);
    }

    private boolean shouldExpireOrder(Order order) {
        if (order == null || order.getStatus() != OrderStatus.PENDING || !isExpired(order)) {
            return false;
        }
        if (order.getPaymentStatus() == PaymentStatus.PAID || order.getPaymentStatus() == PaymentStatus.REFUNDED) {
            return false;
        }

        List<PaymentTransaction> transactions = activeTransactions(order);
        return order.getPaymentStatus() == PaymentStatus.PENDING
                || transactions.stream().anyMatch(transaction -> transaction.getProvider() == PaymentProvider.SEPAY);
    }

    private void expireOrderPayment(Order order) {
        List<PaymentTransaction> transactions = activeTransactions(order);
        boolean hasChanges = false;
        for (PaymentTransaction transaction : transactions) {
            if (transaction.getProvider() != PaymentProvider.SEPAY
                    || transaction.getTransactionType() != PaymentTransactionType.CHARGE) {
                continue;
            }
            if (transaction.getStatus() == PaymentStatus.PAID || transaction.getStatus() == PaymentStatus.REFUNDED) {
                continue;
            }
            if (transaction.getStatus() != PaymentStatus.FAILED) {
                transaction.setStatus(PaymentStatus.FAILED);
                transaction.setFailureReason("SePay checkout expired");
                paymentTransactionRepository.save(transaction);
                hasChanges = true;
            }
        }

        if (order.getStatus() != OrderStatus.CANCELLED) {
            order.setStatus(OrderStatus.CANCELLED);
            hasChanges = true;
        }

        if (hasChanges) {
            orderRepository.save(order);
            paymentTransactionService.refreshOrderPaymentStatus(order);
            log.info("Cancelled expired SePay order {}", order.getOrderCode());
        }
    }

    private List<PaymentTransaction> activeTransactions(Order order) {
        return paymentTransactionRepository.findByOrder(order).stream()
                .filter(transaction -> !Boolean.TRUE.equals(transaction.getIsDeleted()))
                .sorted(Comparator.comparing(
                        PaymentTransaction::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private java.util.Optional<PaymentTransaction> findLatestSepayCharge(Order order) {
        return activeTransactions(order).stream()
                .filter(transaction -> transaction.getProvider() == PaymentProvider.SEPAY)
                .filter(transaction -> transaction.getTransactionType() == PaymentTransactionType.CHARGE)
                .findFirst();
    }

    private String buildSepayQrImageUrl(String accountNumber, String bankCode, BigDecimal amount, String transferContent) {
        BigDecimal normalizedAmount = amount == null
                ? BigDecimal.ZERO
                : amount.setScale(0, RoundingMode.HALF_UP);
        return "https://qr.sepay.vn/img?acc=" + encode(accountNumber)
                + "&bank=" + encode(bankCode)
                + "&amount=" + encode(normalizedAmount.toPlainString())
                + "&des=" + encode(transferContent);
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private void validateConfig() {
        if (!sepayProperties.isEnabled()
                || !StringUtils.hasText(sepayProperties.getBaseUrl())
                || !StringUtils.hasText(sepayProperties.getApiToken())
                || !StringUtils.hasText(sepayProperties.getBankAccountNumber())) {
            throw new AppException(ErrorCode.PAYMENT_PROVIDER_CONFIG_INVALID);
        }
    }

    private void validateWebhookSecret(String secretKey) {
        String configuredSecret = sepayProperties.getWebhookSecret();
        if (StringUtils.hasText(configuredSecret) && !configuredSecret.equals(secretKey)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private Object firstNonNull(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String stringify(Object value) {
        if (value == null) {
            return null;
        }
        String stringValue = String.valueOf(value).trim();
        return stringValue.isEmpty() ? null : stringValue;
    }

    private LocalDateTime parseDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime dateTime) {
            return dateTime;
        }
        try {
            return LocalDateTime.parse(String.valueOf(value));
        } catch (Exception ignored) {
            return null;
        }
    }
}
