package com.project.ecommerce.modules.inventory.repository;

import com.project.ecommerce.modules.inventory.entity.InventoryMovement;
import com.project.ecommerce.modules.inventory.enums.InventoryMovementType;
import com.project.ecommerce.modules.inventory.enums.InventoryReferenceType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, String>, JpaSpecificationExecutor<InventoryMovement> {
    Optional<InventoryMovement> findTopByProductVariantIdAndMovementTypeOrderByCreatedAtDesc(
            String productVariantId,
            InventoryMovementType movementType);

    boolean existsByReferenceTypeAndReferenceIdAndMovementType(
            InventoryReferenceType referenceType,
            String referenceId,
            InventoryMovementType movementType);

    @Query("""
            select distinct m
            from InventoryMovement m
            join fetch m.productVariant v
            join fetch v.productColor pc
            join fetch pc.product
            where m.id in :ids
            """)
    List<InventoryMovement> findDetailsByIds(@Param("ids") Collection<String> ids);

    @Query("""
            select m
            from InventoryMovement m
            join fetch m.productVariant v
            where v.id in :productVariantIds
              and m.movementType = :movementType
            order by m.createdAt desc
            """)
    List<InventoryMovement> findByProductVariantIdInAndMovementTypeOrderByCreatedAtDesc(
            @Param("productVariantIds") Collection<String> productVariantIds,
            @Param("movementType") InventoryMovementType movementType);
}
