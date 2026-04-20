package com.project.ecommerce.modules.product.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.product.dto.response.ProductImageResponse;
import com.project.ecommerce.modules.product.entity.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface ProductImageMapper {
    @Mapping(target = "url", source = "imageUrl")
    @Mapping(target = "isMain", source = "main")
    ProductImageResponse toResponse(ProductImage image);

    default ProductImage toEntity(String imageUrl, boolean isMain) {
        if (imageUrl == null) return null;
        return ProductImage.builder()
                .imageUrl(imageUrl)
                .isMain(isMain)
                .build();
    }
}
