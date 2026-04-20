package com.project.ecommerce.modules.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ColorRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String colorName;

    String hexCode;

    @Valid
    List<VariantRequest> variants;
    List<String> imageUrls;
    Integer mainImageIndex = 0;
}
