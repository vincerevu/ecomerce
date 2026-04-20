package com.project.ecommerce.modules.inventory.repository;

import com.project.ecommerce.modules.inventory.entity.StockImportItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockImportItemRepository extends JpaRepository<StockImportItem, String> {
}
