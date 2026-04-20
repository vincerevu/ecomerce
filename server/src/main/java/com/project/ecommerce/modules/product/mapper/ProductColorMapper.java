package com.project.ecommerce.modules.product.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.product.dto.request.ColorRequest;
import com.project.ecommerce.modules.product.dto.response.ProductColorResponse;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import org.mapstruct.*;

import java.util.ArrayList;
import java.util.List;

@Mapper(config = CentralMapperConfig.class, uses = { ProductImageMapper.class, ProductVariantMapper.class })
public interface ProductColorMapper {

    ProductColorResponse toResponse(ProductColor color);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updateBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    ProductColor toEntity(ColorRequest req);

    @AfterMapping
    default void handleRelations(@MappingTarget ProductColor color, ColorRequest req) {
        color.setIsDeleted(false);

        // 1. Map back-reference for Variants
        if (color.getVariants() != null) {
            color.getVariants().forEach(v -> {
                v.setProductColor(color);
                v.setIsDeleted(false);
            });
        }

        // 2. Map ImageUrls (String) to ProductImage entities with back-reference
        if (req.getImageUrls() != null) {
            List<ProductImage> images = new ArrayList<>();
            for (int i = 0; i < req.getImageUrls().size(); i++) {
                ProductImage img = ProductImage.builder()
                        .imageUrl(req.getImageUrls().get(i))
                        .isMain(req.getMainImageIndex() != null ? i == req.getMainImageIndex() : i == 0)
                        .sortOrder(i)
                        .productColor(color)
                        .isDeleted(false)
                        .build();
                images.add(img);
            }
            color.setImages(images);
        }
    }
}
