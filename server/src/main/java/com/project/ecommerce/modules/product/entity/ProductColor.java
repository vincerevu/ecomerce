package com.project.ecommerce.modules.product.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_colors")
public class ProductColor extends BaseEntity<String> {
    @ManyToOne(fetch = FetchType.LAZY)
    Product product;

    String colorName;
    String hexCode;

    @OneToMany(mappedBy = "productColor", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    List<ProductImage> images;

    @OneToMany(mappedBy = "productColor", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    List<ProductVariant> variants;
}
