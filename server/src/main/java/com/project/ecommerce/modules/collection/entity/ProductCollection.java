package com.project.ecommerce.modules.collection.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import com.project.ecommerce.modules.product.entity.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "collections")
public class ProductCollection extends BaseEntity<String> {
    @Column(nullable = false)
    String name;

    @Column(unique = true, nullable = false)
    String slug;

    @Column(name = "seo_title")
    String seoTitle;

    @Column(name = "seo_description", columnDefinition = "TEXT")
    String seoDescription;

    @Column(name = "canonical_url", nullable = false)
    String canonicalUrl;

    @Column(name = "source_url", nullable = false)
    String sourceUrl;

    @Column(name = "cover_media_url", columnDefinition = "TEXT")
    String coverMediaUrl;

    @Column(name = "cover_media_type")
    String coverMediaType;

    @Column(name = "product_count")
    Integer productCount;

    @Column(name = "sort_order")
    Integer sortOrder;

    @Column(nullable = false)
    @Builder.Default
    Boolean status = true;

    @Builder.Default
    @ManyToMany
    @JoinTable(
            name = "collection_products",
            joinColumns = @JoinColumn(name = "collection_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id"))
    Set<Product> products = new HashSet<>();
}
