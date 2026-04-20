package com.project.ecommerce.modules.inventory.repository;

import com.project.ecommerce.modules.inventory.entity.StockImportReceipt;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface StockImportReceiptRepository extends JpaRepository<StockImportReceipt, String>, JpaSpecificationExecutor<StockImportReceipt> {
    boolean existsByReceiptCode(String receiptCode);
    Optional<StockImportReceipt> findByReceiptCode(String receiptCode);
}
