package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String>, JpaSpecificationExecutor<ProductVariant> {
    List<ProductVariant> findByProductColorIdInOrderBySizeNameAsc(Collection<String> productColorIds);

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

    interface LowStockProductSummary {
        String getProductId();
        String getProductName();
        long getTotalStock();
        long getVariantCount();
    }
}
