package com.project.ecommerce.modules.identity.dto.response;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Set;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String phone;
    String name;
    String gender;
    String email;
    String position;
    String type;
    boolean active;
    String dateOfBirth;
    java.time.LocalDateTime createdAt;
    BigDecimal totalSpent;
    Integer totalPoints;
    MembershipTierResponse membershipTier;
    Set<RoleResponse> roles;

}
