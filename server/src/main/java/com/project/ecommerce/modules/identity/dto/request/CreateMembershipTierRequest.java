package com.project.ecommerce.modules.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateMembershipTierRequest {
    @NotBlank(message = "Tier name is required")
    String tierName;

    @NotNull(message = "Minimum spent is required")
    BigDecimal minSpent;

    @NotNull(message = "Discount percent is required")
    Integer discountPercent;

    String description;
}
