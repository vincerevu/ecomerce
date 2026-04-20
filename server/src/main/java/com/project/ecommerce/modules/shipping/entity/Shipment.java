package com.project.ecommerce.modules.shipping.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.shipping.enums.RequiredNoteType;
import com.project.ecommerce.modules.shipping.enums.ShipmentStatus;
import com.project.ecommerce.modules.shipping.enums.ShippingProvider;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
@Table(name = "shipments")
public class Shipment extends BaseEntity<String> {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ShippingProvider provider;

    @Column(nullable = false, unique = true)
    String clientOrderCode;

    @Column(unique = true)
    String trackingCode;

    Long shopId;
    Integer serviceId;
    Integer serviceTypeId;
    Integer paymentTypeId;

    @Enumerated(EnumType.STRING)
    RequiredNoteType requiredNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ShipmentStatus status;

    @Column(precision = 14, scale = 2)
    BigDecimal shippingFee;

    @Column(precision = 14, scale = 2)
    BigDecimal codAmount;

    @Column(precision = 14, scale = 2)
    BigDecimal insuranceValue;

    Integer weight;
    Integer length;
    Integer width;
    Integer height;

    String toName;
    String toPhone;

    @Column(columnDefinition = "TEXT")
    String toAddress;

    String toProvinceName;
    String toDistrictName;
    String toWardName;
    Integer toDistrictId;
    String toWardCode;

    String senderName;
    String senderPhone;

    @Column(columnDefinition = "TEXT")
    String senderAddress;

    String senderProvinceName;
    String senderDistrictName;
    String senderWardName;
    Integer fromDistrictId;

    LocalDateTime expectedDeliveryTime;

    @Column(columnDefinition = "TEXT")
    String note;

    @Column(columnDefinition = "TEXT")
    String providerPayload;

    @OneToMany(mappedBy = "shipment", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    @lombok.Builder.Default
    List<ShipmentEvent> events = new ArrayList<>();
}
