package com.project.ecommerce.modules.identity.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Set;

import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "membership_tiers")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MembershipTier extends BaseEntity<String> {
    @Column(unique = true, nullable = false)
    private String tierName;

    private BigDecimal minSpent;

    private Integer discountPercent;

    private String description;
}
