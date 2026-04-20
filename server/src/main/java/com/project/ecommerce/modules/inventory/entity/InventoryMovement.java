package com.project.ecommerce.modules.inventory.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.inventory.enums.InventoryMovementType;
import com.project.ecommerce.modules.inventory.enums.InventoryReferenceType;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
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
@Table(name = "inventory_movements")
public class InventoryMovement extends BaseEntity<String> {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_variant_id", nullable = false)
    ProductVariant productVariant;

    @Enumerated(EnumType.STRING)
    InventoryMovementType movementType;

    Integer quantity;
    Integer beforeQuantity;
    Integer afterQuantity;
    BigDecimal unitCost;

    @Enumerated(EnumType.STRING)
    InventoryReferenceType referenceType;

    String referenceId;
    String note;
}
