package com.project.ecommerce.modules.product.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Set;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateProductRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String name;

    @NotBlank(message = "FIELD_REQUIRED")
    String slug;
    @NotBlank(message = "FIELD_REQUIRED")
    String description;
    String shortDescription;
    String material;
    String gender;
    String style;
    @NotBlank(message = "FIELD_REQUIRED")
    String categoryId;
    Set<String> tagIds;

    @Valid
    List<ColorRequest> colors;

    String status;
}
