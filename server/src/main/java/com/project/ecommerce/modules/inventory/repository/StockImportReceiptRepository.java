package com.project.ecommerce.modules.inventory.repository;

import com.project.ecommerce.modules.inventory.entity.StockImportReceipt;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StockImportReceiptRepository extends JpaRepository<StockImportReceipt, String>, JpaSpecificationExecutor<StockImportReceipt> {
    boolean existsByReceiptCode(String receiptCode);
    Optional<StockImportReceipt> findByReceiptCode(String receiptCode);

    @Query("""
            select distinct r
            from StockImportReceipt r
            left join fetch r.items i
            left join fetch i.productVariant v
            left join fetch v.productColor pc
            left join fetch pc.product
            where r.id in :ids
            """)
    List<StockImportReceipt> findDetailsByIds(@Param("ids") Collection<String> ids);

    @Query("""
            select distinct r
            from StockImportReceipt r
            left join fetch r.items i
            left join fetch i.productVariant v
            left join fetch v.productColor pc
            left join fetch pc.product
            where r.id = :id
            """)
    Optional<StockImportReceipt> findDetailById(@Param("id") String id);
}
