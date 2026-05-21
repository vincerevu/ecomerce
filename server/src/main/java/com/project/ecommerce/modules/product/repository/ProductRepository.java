package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.Product;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.Collection;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

  Optional<Product> findBySlug(String slug);

  @Query("""
      select distinct p
      from Product p
      left join fetch p.category
      left join fetch p.tags
      where p.id = :id
      """)
  Optional<Product> findDetailById(@Param("id") String id);

  @Query("""
      select distinct p
      from Product p
      left join fetch p.category
      left join fetch p.tags
      where p.slug = :slug
      """)
  Optional<Product> findDetailBySlug(@Param("slug") String slug);

  @Query("""
      select distinct p
      from Product p
      left join fetch p.category
      left join fetch p.tags
      where p.id in :ids
      """)
  List<Product> findDetailsByIds(@Param("ids") Collection<String> ids);

  List<Product> findByIdIn(Collection<String> ids);

  Optional<Product> findOneById(String id);

  Optional<Product> findOneBySlug(String slug);

  List<Product> findBySlugIn(Collection<String> slugs);

  @Query("""
      select p
      from Product p
      join p.collections c
      where c.slug = :slug and p.isDeleted = false and c.status = true
      """)
  Page<Product> findByCollectionSlug(@Param("slug") String slug, Pageable pageable);

  boolean existsBySlug(String slug);

  boolean existsBySlugAndIdNot(String slug, String id);

  List<Product> findBySlugIsNotNull();

  long countByStatus(String status);

  @Query("""
      select p.id as id,
             p.name as name,
             p.slug as slug,
             p.shortDescription as shortDescription,
             c.id as categoryId,
             c.name as categoryName,
             c.slug as categorySlug,
             p.status as status,
             p.createdAt as createdAt
      from Product p
      left join p.category c
      where p.id in :ids
      """)
  List<ProductListBaseView> findListBaseByIds(@Param("ids") Collection<String> ids);

  @Query("""
      select pc.product.id as productId,
             pc.id as id,
             pc.colorName as colorName,
             pc.hexCode as hexCode
      from ProductColor pc
      where pc.product.id in :ids
      order by pc.createdAt asc
      """)
  List<ProductColorSummaryView> findColorSummariesByProductIds(@Param("ids") Collection<String> ids);

  @Query("""
      select pc.product.id as productId,
             min(v.originalPrice) as minOriginalPrice,
             min(case
                   when v.salePrice is not null and v.salePrice > 0
                   then v.salePrice
                   else v.originalPrice
                 end) as displayPrice,
             sum(v.stockQuantity) as totalStock,
             count(v.id) as variantCount
      from ProductVariant v
      join v.productColor pc
      where pc.product.id in :ids
      group by pc.product.id
      """)
  List<ProductPriceStockView> findPriceStockByProductIds(@Param("ids") Collection<String> ids);

  @Query("""
      select pc.product.id as productId,
             img.imageUrl as imageUrl,
             img.sortOrder as sortOrder,
             img.isMain as main
      from ProductImage img
      join img.productColor pc
      where pc.product.id in :ids
      order by pc.product.id asc,
               case when img.isMain = true then 0 else 1 end asc,
               img.sortOrder asc
      """)
  List<ProductThumbnailView> findThumbnailCandidatesByProductIds(@Param("ids") Collection<String> ids);

  interface ProductListBaseView {
    String getId();
    String getName();
    String getSlug();
    String getShortDescription();
    String getCategoryId();
    String getCategoryName();
    String getCategorySlug();
    String getStatus();
    LocalDateTime getCreatedAt();
  }

  interface ProductColorSummaryView {
    String getProductId();
    String getId();
    String getColorName();
    String getHexCode();
  }

  interface ProductPriceStockView {
    String getProductId();
    BigDecimal getMinOriginalPrice();
    BigDecimal getDisplayPrice();
    Long getTotalStock();
    Long getVariantCount();
  }

  interface ProductThumbnailView {
    String getProductId();
    String getImageUrl();
    Integer getSortOrder();
    Boolean getMain();
  }
}
