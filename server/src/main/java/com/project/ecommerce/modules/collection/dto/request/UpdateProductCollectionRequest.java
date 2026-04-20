package com.project.ecommerce.modules.collection.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProductCollectionRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    @JsonProperty("name")
    String name;

    @NotBlank(message = "FIELD_REQUIRED")
    @JsonProperty("slug")
    String slug;

    @JsonProperty("seoTitle")
    String seoTitle;

    @JsonProperty("seoDescription")
    String seoDescription;

    @JsonProperty("canonicalUrl")
    String canonicalUrl;

    @JsonProperty("sourceUrl")
    String sourceUrl;

    @JsonProperty("coverMediaUrl")
    String coverMediaUrl;

    @JsonProperty("sortOrder")
    Integer sortOrder;

    @JsonProperty("status")
    Boolean status;

    @JsonProperty("productCount")
    Integer productCount;

    @JsonProperty("productIds")
    List<String> productIds;
}
