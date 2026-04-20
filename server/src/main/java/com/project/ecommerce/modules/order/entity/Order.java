package com.project.ecommerce.modules.order.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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
@Table(name = "orders")
public class Order extends BaseEntity<String> {

    @Column(unique = true, nullable = false)
    String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;

    @Column(nullable = false)
    String customerName;

    @Column(nullable = false)
    String customerPhone;

    String customerEmail;

    @Column(columnDefinition = "TEXT")
    String shippingAddress;

    @Column(columnDefinition = "TEXT")
    String shippingDetail;

    String shippingProvinceName;

    String shippingProvinceCode;

    String shippingDistrictName;

    String shippingDistrictCode;

    String shippingWardName;

    String shippingWardCode;

    @Column(columnDefinition = "TEXT")
    String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PaymentStatus paymentStatus;

    @Column(nullable = false)
    BigDecimal subtotal;

    @Column(nullable = false)
    BigDecimal shippingFee;

    @Column(nullable = false)
    BigDecimal discountAmount;

    @Column(nullable = false)
    BigDecimal totalAmount;

    @OneToMany(mappedBy = "order", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    @lombok.Builder.Default
    List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    @lombok.Builder.Default
    List<PaymentTransaction> paymentTransactions = new ArrayList<>();
}
