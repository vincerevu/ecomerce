package com.project.ecommerce.modules.payment.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.payment.enums.PaymentMethod;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.enums.PaymentTransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction extends BaseEntity<String> {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    Order order;

    @Column(nullable = false, unique = true)
    String transactionCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PaymentTransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PaymentStatus status;

    @Column(nullable = false, precision = 14, scale = 2)
    BigDecimal amount;

    @Column(nullable = false)
    String currency;

    String providerReference;

    LocalDateTime processedAt;

    String failureReason;

    @Column(columnDefinition = "TEXT")
    String notes;

    @Column(columnDefinition = "TEXT")
    String rawResponse;
}
