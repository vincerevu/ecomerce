package com.project.ecommerce.modules.identity.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.identity.enums.Gender;
import com.project.ecommerce.modules.identity.enums.UserType;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "users")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends BaseEntity<String> {
    @Column(unique = true, nullable = false)
    String phone;

    @Column(nullable = true)
    String password;

    @Column(nullable = false)
    String name;

    @Column(unique = true, nullable = true)
    String email;

    String position;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    UserType type = UserType.CUSTOMER;

    @Column(nullable = false)
    @Builder.Default
    boolean active = true;

    @Enumerated(EnumType.STRING)
    Gender gender;

    @Column(nullable = true)
    LocalDate dateOfBirth;

    @OneToMany(mappedBy = "user", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    Set<Role> roles;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_tier_id")
    private MembershipTier membershipTier;

    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Builder.Default
    private Integer totalPoints = 0;
}
