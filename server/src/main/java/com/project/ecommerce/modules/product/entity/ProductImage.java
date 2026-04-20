package com.project.ecommerce.modules.product.entity;

import com.project.ecommerce.common.entity.BaseImage;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_images")
public class ProductImage extends BaseImage {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_color_id")
    private ProductColor productColor;
    boolean isMain = false;
}
