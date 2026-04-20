package com.project.ecommerce.modules.payment.config;

import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import com.project.ecommerce.modules.payment.enums.PaymentMethod;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.enums.PaymentTransactionType;
import com.project.ecommerce.modules.payment.repository.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
@RequiredArgsConstructor
public class PaymentSampleDataConfig {

    private static final int MIN_PAYMENT_COUNT = 54;

    private final TransactionTemplate transactionTemplate;

    @Bean
    @org.springframework.core.annotation.Order(260)
    ApplicationRunner paymentSampleDataRunner(
            PaymentTransactionRepository paymentTransactionRepository,
            OrderRepository orderRepository) {
        return args -> transactionTemplate.executeWithoutResult(status -> {
            long existingCount = paymentTransactionRepository.countBy();
            if (existingCount >= MIN_PAYMENT_COUNT) {
                return;
            }

            List<Order> orders = orderRepository.findAll();
            if (orders.isEmpty()) {
                return;
            }

            List<PaymentTransaction> paymentTransactions = new ArrayList<>();
            int cursor = (int) existingCount;
            while (existingCount + paymentTransactions.size() < MIN_PAYMENT_COUNT) {
                Order order = orders.get(cursor % orders.size());
                PaymentTransactionType transactionType = cursor % 7 == 0
                        ? PaymentTransactionType.REFUND
                        : PaymentTransactionType.CHARGE;
                PaymentStatus paymentStatus = resolveStatus(cursor, transactionType);
                BigDecimal amount = transactionType == PaymentTransactionType.REFUND
                        ? order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0
                                ? order.getDiscountAmount()
                                : order.getTotalAmount().min(BigDecimal.valueOf(120_000))
                        : order.getTotalAmount();

                paymentTransactions.add(PaymentTransaction.builder()
                        .order(order)
                        .transactionCode(String.format("PAY-SEED-%03d", cursor + 1))
                        .provider(resolveProvider(cursor))
                        .paymentMethod(resolveMethod(cursor))
                        .transactionType(transactionType)
                        .status(paymentStatus)
                        .amount(amount)
                        .currency("VND")
                        .providerReference(String.format("REF-%04d", cursor + 1))
                        .processedAt(paymentStatus == PaymentStatus.PAID || paymentStatus == PaymentStatus.REFUNDED
                                ? LocalDateTime.now().minusHours(cursor % 48L)
                                : null)
                        .failureReason(paymentStatus == PaymentStatus.FAILED
                                ? "Giao dịch bị từ chối bởi cổng thanh toán"
                                : null)
                        .notes(transactionType == PaymentTransactionType.REFUND
                                ? "Hoàn tiền một phần cho khách hàng"
                                : "Giao dịch thanh toán mẫu phục vụ kiểm thử quản trị")
                        .rawResponse("{\"seed\":true,\"index\":" + (cursor + 1) + "}")
                        .build());
                cursor++;
            }

            paymentTransactionRepository.saveAll(paymentTransactions);

            for (Order order : orders) {
                List<PaymentTransaction> orderTransactions = paymentTransactionRepository.findByOrder(order).stream()
                        .filter(transaction -> !Boolean.TRUE.equals(transaction.getIsDeleted()))
                        .toList();
                if (orderTransactions.stream().anyMatch(transaction -> transaction.getStatus() == PaymentStatus.REFUNDED)) {
                    order.setPaymentStatus(PaymentStatus.REFUNDED);
                } else if (orderTransactions.stream().anyMatch(transaction -> transaction.getStatus() == PaymentStatus.PAID)) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                } else if (orderTransactions.stream().anyMatch(transaction -> transaction.getStatus() == PaymentStatus.PENDING)) {
                    order.setPaymentStatus(PaymentStatus.PENDING);
                } else if (orderTransactions.stream().anyMatch(transaction -> transaction.getStatus() == PaymentStatus.FAILED)) {
                    order.setPaymentStatus(PaymentStatus.FAILED);
                } else {
                    order.setPaymentStatus(PaymentStatus.UNPAID);
                }
            }

            orderRepository.saveAll(orders);
        });
    }

    private PaymentProvider resolveProvider(int cursor) {
        return switch (cursor % 5) {
            case 0 -> PaymentProvider.MOMO;
            case 1 -> PaymentProvider.VNPAY;
            case 2 -> PaymentProvider.STRIPE;
            case 3 -> PaymentProvider.ZALOPAY;
            default -> PaymentProvider.MANUAL;
        };
    }

    private PaymentMethod resolveMethod(int cursor) {
        return switch (cursor % 4) {
            case 0 -> PaymentMethod.BANK_TRANSFER;
            case 1 -> PaymentMethod.CARD;
            case 2 -> PaymentMethod.E_WALLET;
            default -> PaymentMethod.COD;
        };
    }

    private PaymentStatus resolveStatus(int cursor, PaymentTransactionType transactionType) {
        if (transactionType == PaymentTransactionType.REFUND) {
            return cursor % 2 == 0 ? PaymentStatus.REFUNDED : PaymentStatus.PENDING;
        }
        return switch (cursor % 5) {
            case 0 -> PaymentStatus.PAID;
            case 1 -> PaymentStatus.PENDING;
            case 2 -> PaymentStatus.FAILED;
            case 3 -> PaymentStatus.PAID;
            default -> PaymentStatus.UNPAID;
        };
    }
}
