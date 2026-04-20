package com.project.ecommerce.modules.inventory.repository;

import com.project.ecommerce.modules.inventory.entity.InventoryMovement;
import com.project.ecommerce.modules.inventory.enums.InventoryMovementType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, String>, JpaSpecificationExecutor<InventoryMovement> {
    Optional<InventoryMovement> findTopByProductVariantIdAndMovementTypeOrderByCreatedAtDesc(
            String productVariantId,
            InventoryMovementType movementType);
}
