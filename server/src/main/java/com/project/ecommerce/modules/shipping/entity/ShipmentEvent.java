package com.project.ecommerce.modules.shipping.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.shipping.enums.ShipmentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
@Table(name = "shipment_events")
public class ShipmentEvent extends BaseEntity<String> {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    Shipment shipment;

    String providerStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ShipmentStatus internalStatus;

    @Column(columnDefinition = "TEXT")
    String description;

    LocalDateTime eventTime;

    @Column(columnDefinition = "TEXT")
    String rawPayload;
}
