package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.projection.LowStockProductSummary;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String>, JpaSpecificationExecutor<ProductVariant> {
    List<ProductVariant> findByProductColorIdInOrderBySizeNameAsc(Collection<String> productColorIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select v
            from ProductVariant v
            where v.id = :id
            """)
    Optional<ProductVariant> findByIdForUpdate(@Param("id") String id);

    @Query("""
            select distinct v
            from ProductVariant v
            join fetch v.productColor pc
            join fetch pc.product
            left join fetch pc.images
            where v.id = :id
            """)
    Optional<ProductVariant> findDetailById(@Param("id") String id);

    @Query("""
            select distinct v
            from ProductVariant v
            join fetch v.productColor pc
            join fetch pc.product
            left join fetch pc.images
            where v.id in :ids
            """)
    List<ProductVariant> findDetailsByIds(@Param("ids") Collection<String> ids);

    void deleteByProductColorProductId(String productId);

    @Query("""
            select pc.product.id as productId,
                   pc.product.name as productName,
                   coalesce(sum(v.stockQuantity), 0) as totalStock,
                   count(v) as variantCount
            from ProductVariant v
            join v.productColor pc
            where pc.product.isDeleted = false
            group by pc.product.id, pc.product.name
            having coalesce(sum(v.stockQuantity), 0) > 0
               and coalesce(sum(v.stockQuantity), 0) < :threshold
            order by coalesce(sum(v.stockQuantity), 0) asc
            """)
    List<LowStockProductSummary> findLowStockProductSummaries(@Param("threshold") int threshold);
}
