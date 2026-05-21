package com.project.ecommerce.modules.order.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.inventory.entity.InventoryMovement;
import com.project.ecommerce.modules.inventory.enums.InventoryMovementType;
import com.project.ecommerce.modules.inventory.enums.InventoryReferenceType;
import com.project.ecommerce.modules.inventory.repository.InventoryMovementRepository;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.entity.OrderItem;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderStockService {

    private final ProductVariantRepository productVariantRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    @Transactional
    public void reserveStockForOrder(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }

        for (OrderItem item : safeItems(order)) {
            ProductVariant itemVariant = item.getProductVariant();
            if (itemVariant == null || itemVariant.getId() == null) {
                continue;
            }

            ProductVariant variant = productVariantRepository.findByIdForUpdate(itemVariant.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
            int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
            if (quantity <= 0) {
                throw new AppException(ErrorCode.FIELD_REQUIRED);
            }

            int beforeQuantity = normalizeStock(variant);
            if (beforeQuantity < quantity) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }

            int afterQuantity = beforeQuantity - quantity;
            variant.setStockQuantity(afterQuantity);
            productVariantRepository.save(variant);
            saveMovement(order, variant, InventoryMovementType.EXPORT, quantity, beforeQuantity, afterQuantity,
                    "Reserved for order " + order.getOrderCode());
        }
    }

    @Transactional
    public void releaseStockForCancelledOrder(Order order) {
        if (order == null || order.getId() == null || hasReleaseMovement(order.getId()) || !hasReserveMovement(order.getId())) {
            return;
        }

        for (OrderItem item : safeItems(order)) {
            ProductVariant itemVariant = item.getProductVariant();
            if (itemVariant == null || itemVariant.getId() == null) {
                continue;
            }

            ProductVariant variant = productVariantRepository.findByIdForUpdate(itemVariant.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
            int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
            if (quantity <= 0) {
                continue;
            }

            int beforeQuantity = normalizeStock(variant);
            int afterQuantity = beforeQuantity + quantity;
            variant.setStockQuantity(afterQuantity);
            productVariantRepository.save(variant);
            saveMovement(order, variant, InventoryMovementType.RETURN, quantity, beforeQuantity, afterQuantity,
                    "Released after order cancellation " + order.getOrderCode());
        }
    }

    private boolean hasReserveMovement(String orderId) {
        return inventoryMovementRepository.existsByReferenceTypeAndReferenceIdAndMovementType(
                InventoryReferenceType.ORDER,
                orderId,
                InventoryMovementType.EXPORT);
    }

    private boolean hasReleaseMovement(String orderId) {
        return inventoryMovementRepository.existsByReferenceTypeAndReferenceIdAndMovementType(
                InventoryReferenceType.ORDER,
                orderId,
                InventoryMovementType.RETURN);
    }

    private void saveMovement(
            Order order,
            ProductVariant variant,
            InventoryMovementType movementType,
            int quantity,
            int beforeQuantity,
            int afterQuantity,
            String note) {
        InventoryMovement movement = InventoryMovement.builder()
                .productVariant(variant)
                .movementType(movementType)
                .quantity(quantity)
                .beforeQuantity(beforeQuantity)
                .afterQuantity(afterQuantity)
                .referenceType(InventoryReferenceType.ORDER)
                .referenceId(order.getId())
                .note(note)
                .build();
        inventoryMovementRepository.save(movement);
    }

    private int normalizeStock(ProductVariant variant) {
        return variant.getStockQuantity() == null ? 0 : variant.getStockQuantity();
    }

    private List<OrderItem> safeItems(Order order) {
        return order.getItems() == null ? List.of() : order.getItems();
    }
}
