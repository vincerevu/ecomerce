package com.project.ecommerce.modules.product.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateCategoryRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    @JsonProperty("name")
    String name;

    @NotBlank(message = "FIELD_REQUIRED")
    @JsonProperty("slug")
    String slug;

    @JsonProperty("description")
    String description;

    @JsonProperty("parentId")
    String parentId;

    @JsonProperty("sortOrder")
    Integer sortOrder;

    @JsonProperty("iconUrl")
    String iconUrl;
}
