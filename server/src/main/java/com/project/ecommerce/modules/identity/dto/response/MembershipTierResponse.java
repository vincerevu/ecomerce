package com.project.ecommerce.modules.identity.dto.response;

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
public class MembershipTierResponse {
    String id;
    String tierName;
    BigDecimal minSpent;
    Integer discountPercent;
    String description;
}
