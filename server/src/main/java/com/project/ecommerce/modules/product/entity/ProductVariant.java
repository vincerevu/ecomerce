package com.project.ecommerce.modules.product.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_variants")
public class ProductVariant extends BaseEntity<String> {
    @ManyToOne(fetch = FetchType.LAZY)
    ProductColor productColor;

    String sizeName;
    BigDecimal originalPrice;
    BigDecimal salePrice;
    Integer stockQuantity;

    @Version
    Long version;
}
