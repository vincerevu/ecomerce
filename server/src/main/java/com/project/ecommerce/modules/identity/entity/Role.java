package com.project.ecommerce.modules.identity.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.Builder.Default;

import java.util.Set;
@Entity
@Table(name = "roles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Role {
    @Id
    String name;

    String description;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Default
    Boolean isDeleted = false;

    @ManyToMany
    Set<Permission> permissions;
}
