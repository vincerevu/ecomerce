package com.project.ecommerce.modules.product.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "products")
public class Product extends BaseEntity<String> {
    @Column(nullable = false)
    String name;

    @Column(unique = true, nullable = false)
    String slug;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(columnDefinition = "TEXT")
    String shortDescription;

    @Column(columnDefinition = "TEXT")
    String material;
    String gender;
    String style;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    @Builder.Default
    @OneToMany(mappedBy = "product", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    private List<ProductColor> colors = new ArrayList<>();

    @Builder.Default
    @ManyToMany
    @JoinTable(name = "product_tag", joinColumns = @JoinColumn(name = "product_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    @Column(nullable = false)
    @Builder.Default
    String status = "ACTIVE";

    @Builder.Default
    @ManyToMany(mappedBy = "products")
    private Set<ProductCollection> collections = new HashSet<>();
}
