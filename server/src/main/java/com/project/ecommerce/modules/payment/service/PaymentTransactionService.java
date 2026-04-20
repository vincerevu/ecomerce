package com.project.ecommerce.modules.payment.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.payment.dto.request.CreatePaymentTransactionRequest;
import com.project.ecommerce.modules.payment.dto.request.UpdatePaymentTransactionRequest;
import com.project.ecommerce.modules.payment.dto.response.PaymentTransactionResponse;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import com.project.ecommerce.modules.payment.enums.PaymentMethod;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.enums.PaymentTransactionType;
import com.project.ecommerce.modules.payment.mapper.PaymentTransactionMapper;
import com.project.ecommerce.modules.payment.repository.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentTransactionService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final PaymentTransactionMapper paymentTransactionMapper;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('PAYMENT:VIEW')")
    public PageResponse<PaymentTransactionResponse> getPayments(Pageable pageable,
            Specification<PaymentTransaction> spec) {
        Page<PaymentTransaction> paymentPage = paymentTransactionRepository.findAll(spec, pageable);
        return PageResponse.<PaymentTransactionResponse>builder()
                .currentPage(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalPages(paymentPage.getTotalPages())
                .totalElements(paymentPage.getTotalElements())
                .last(paymentPage.isLast())
                .data(paymentPage.getContent().stream().map(paymentTransactionMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('PAYMENT:VIEW')")
    public PaymentTransactionResponse getById(String id) {
        return paymentTransactionMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    @PreAuthorize("hasAuthority('PAYMENT:CREATE')")
    public PaymentTransactionResponse create(CreatePaymentTransactionRequest request) {
        return createInternal(resolveOrder(request.getOrderId()), request);
    }

    @Transactional
    @PreAuthorize("hasAuthority('PAYMENT:UPDATE')")
    public PaymentTransactionResponse update(String id, UpdatePaymentTransactionRequest request) {
        PaymentTransaction paymentTransaction = findOrThrow(id);
        paymentTransaction.setStatus(request.getStatus());
        paymentTransaction.setProviderReference(request.getProviderReference());
        paymentTransaction.setProcessedAt(request.getProcessedAt());
        paymentTransaction.setFailureReason(request.getFailureReason());
        paymentTransaction.setNotes(request.getNotes());
        paymentTransaction.setRawResponse(request.getRawResponse());
        normalizeTimestamps(paymentTransaction);

        PaymentTransaction saved = paymentTransactionRepository.save(paymentTransaction);
        syncOrderPaymentStatusInternal(saved.getOrder());
        return paymentTransactionMapper.toResponse(saved);
    }

    @Transactional
    @PreAuthorize("hasAuthority('PAYMENT:DELETE')")
    public void delete(String id) {
        PaymentTransaction paymentTransaction = findOrThrow(id);
        Order order = paymentTransaction.getOrder();
        paymentTransaction.setIsDeleted(true);
        paymentTransactionRepository.save(paymentTransaction);
        syncOrderPaymentStatusInternal(order);
    }

    @Transactional
    public PaymentTransactionResponse createForCheckout(
            Order order,
            PaymentProvider provider,
            PaymentMethod paymentMethod,
            PaymentStatus status,
            BigDecimal amount,
            String providerReference,
            String notes,
            Object rawResponse) {
        CreatePaymentTransactionRequest request = new CreatePaymentTransactionRequest();
        request.setOrderId(order.getId());
        request.setProvider(provider);
        request.setPaymentMethod(paymentMethod);
        request.setTransactionType(PaymentTransactionType.CHARGE);
        request.setStatus(status);
        request.setAmount(amount);
        request.setCurrency("VND");
        request.setProviderReference(providerReference);
        request.setNotes(notes);
        request.setRawResponse(rawResponse != null ? String.valueOf(rawResponse) : null);
        return createInternal(order, request);
    }

    @Transactional
    public PaymentTransactionResponse createCodForCheckout(String orderId) {
        Order order = resolveOrder(orderId);
        return createForCheckout(
                order,
                PaymentProvider.COD,
                PaymentMethod.COD,
                PaymentStatus.UNPAID,
                order.getTotalAmount(),
                null,
                "Thanh toán khi nhận hàng",
                null);
    }

    @Transactional
    public PaymentTransactionResponse updateForCheckout(
            String paymentId,
            PaymentStatus status,
            Object rawResponse,
            String providerReference) {
        PaymentTransaction paymentTransaction = findOrThrow(paymentId);
        paymentTransaction.setStatus(status);
        paymentTransaction.setRawResponse(rawResponse != null ? String.valueOf(rawResponse) : null);
        if (providerReference != null && !providerReference.isBlank()) {
            paymentTransaction.setProviderReference(providerReference);
        }
        normalizeTimestamps(paymentTransaction);
        PaymentTransaction saved = paymentTransactionRepository.save(paymentTransaction);
        syncOrderPaymentStatusInternal(saved.getOrder());
        return paymentTransactionMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaymentTransaction findEntityById(String paymentId) {
        return findOrThrow(paymentId);
    }

    @Transactional
    public void refreshOrderPaymentStatus(Order order) {
        syncOrderPaymentStatusInternal(order);
    }

    @Transactional
    public void failOpenChargeTransactions(Order order, String failureReason) {
        List<PaymentTransaction> transactions = paymentTransactionRepository.findByOrder(order).stream()
                .filter(transaction -> !Boolean.TRUE.equals(transaction.getIsDeleted()))
                .filter(transaction -> transaction.getTransactionType() == PaymentTransactionType.CHARGE)
                .filter(transaction -> transaction.getStatus() != PaymentStatus.PAID
                        && transaction.getStatus() != PaymentStatus.REFUNDED
                        && transaction.getStatus() != PaymentStatus.FAILED)
                .toList();

        if (transactions.isEmpty()) {
            return;
        }

        for (PaymentTransaction transaction : transactions) {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason(failureReason);
            paymentTransactionRepository.save(transaction);
        }

        syncOrderPaymentStatusInternal(order);
    }

    private PaymentTransaction findOrThrow(String id) {
        return paymentTransactionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_TRANSACTION_NOT_FOUND));
    }

    private Order resolveOrder(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private PaymentTransactionResponse createInternal(Order order, CreatePaymentTransactionRequest request) {
        PaymentTransaction paymentTransaction = paymentTransactionMapper.toEntity(request);
        paymentTransaction.setOrder(order);
        paymentTransaction.setTransactionCode(resolveTransactionCode(request.getTransactionCode()));
        normalizeTimestamps(paymentTransaction);

        PaymentTransaction saved = paymentTransactionRepository.save(paymentTransaction);
        syncOrderPaymentStatusInternal(order);
        return paymentTransactionMapper.toResponse(saved);
    }

    private String resolveTransactionCode(String requestedCode) {
        if (requestedCode != null && !requestedCode.isBlank()) {
            if (paymentTransactionRepository.existsByTransactionCode(requestedCode)) {
                throw new AppException(ErrorCode.PAYMENT_TRANSACTION_CODE_ALREADY_EXISTS);
            }
            return requestedCode;
        }

        String generatedCode = "PAY-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        if (paymentTransactionRepository.existsByTransactionCode(generatedCode)) {
            generatedCode = generatedCode + "-" + System.currentTimeMillis() % 1000;
        }
        return generatedCode;
    }

    private void normalizeTimestamps(PaymentTransaction paymentTransaction) {
        boolean shouldSetProcessedAt = paymentTransaction.getStatus() == PaymentStatus.PAID
                || paymentTransaction.getStatus() == PaymentStatus.REFUNDED;
        if (shouldSetProcessedAt && paymentTransaction.getProcessedAt() == null) {
            paymentTransaction.setProcessedAt(LocalDateTime.now());
        }
    }

    private void syncOrderPaymentStatusInternal(Order order) {
        List<PaymentTransaction> transactions = paymentTransactionRepository.findByOrder(order).stream()
                .filter(transaction -> !Boolean.TRUE.equals(transaction.getIsDeleted()))
                .sorted(Comparator.comparing(PaymentTransaction::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        order.setPaymentStatus(resolveOrderPaymentStatus(transactions));
        orderRepository.save(order);
    }

    private PaymentStatus resolveOrderPaymentStatus(List<PaymentTransaction> transactions) {
        if (transactions.isEmpty()) {
            return PaymentStatus.UNPAID;
        }

        boolean hasRefunded = transactions.stream()
                .anyMatch(transaction -> transaction.getTransactionType() == PaymentTransactionType.REFUND
                        && transaction.getStatus() == PaymentStatus.REFUNDED);
        if (hasRefunded) {
            return PaymentStatus.REFUNDED;
        }

        boolean hasPaid = transactions.stream()
                .anyMatch(transaction -> transaction.getTransactionType() == PaymentTransactionType.CHARGE
                        && transaction.getStatus() == PaymentStatus.PAID);
        if (hasPaid) {
            return PaymentStatus.PAID;
        }

        boolean hasPending = transactions.stream()
                .anyMatch(transaction -> transaction.getStatus() == PaymentStatus.PENDING);
        if (hasPending) {
            return PaymentStatus.PENDING;
        }

        boolean hasFailed = transactions.stream()
                .anyMatch(transaction -> transaction.getStatus() == PaymentStatus.FAILED);
        if (hasFailed) {
            return PaymentStatus.FAILED;
        }

        return PaymentStatus.UNPAID;
    }
}
