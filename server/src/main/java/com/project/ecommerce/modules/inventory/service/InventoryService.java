package com.project.ecommerce.modules.inventory.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.inventory.dto.request.CreateStockImportItemRequest;
import com.project.ecommerce.modules.inventory.dto.request.CreateStockImportReceiptRequest;
import com.project.ecommerce.modules.inventory.dto.response.InventoryMovementResponse;
import com.project.ecommerce.modules.inventory.dto.response.InventoryStockResponse;
import com.project.ecommerce.modules.inventory.dto.response.StockImportReceiptResponse;
import com.project.ecommerce.modules.inventory.entity.InventoryMovement;
import com.project.ecommerce.modules.inventory.entity.StockImportItem;
import com.project.ecommerce.modules.inventory.entity.StockImportReceipt;
import com.project.ecommerce.modules.inventory.enums.InventoryMovementType;
import com.project.ecommerce.modules.inventory.enums.InventoryReferenceType;
import com.project.ecommerce.modules.inventory.mapper.InventoryMovementMapper;
import com.project.ecommerce.modules.inventory.mapper.StockImportReceiptMapper;
import com.project.ecommerce.modules.inventory.repository.InventoryMovementRepository;
import com.project.ecommerce.modules.inventory.repository.StockImportReceiptRepository;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductVariantRepository productVariantRepository;
    private final StockImportReceiptRepository stockImportReceiptRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final StockImportReceiptMapper stockImportReceiptMapper;
    private final InventoryMovementMapper inventoryMovementMapper;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('INVENTORY:VIEW')")
    public PageResponse<InventoryStockResponse> getStocks(Pageable pageable, Specification<ProductVariant> spec) {
        Page<ProductVariant> variantPage = productVariantRepository.findAll(spec, pageable);
        List<InventoryStockResponse> content = variantPage.getContent().stream()
                .map(this::toStockResponse)
                .toList();
        Page<InventoryStockResponse> stockPage = new PageImpl<>(content, pageable, variantPage.getTotalElements());
        return PageResponse.<InventoryStockResponse>builder()
                .currentPage(stockPage.getNumber())
                .pageSize(stockPage.getSize())
                .totalPages(stockPage.getTotalPages())
                .totalElements(stockPage.getTotalElements())
                .last(stockPage.isLast())
                .data(stockPage.getContent())
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('INVENTORY:VIEW')")
    public PageResponse<StockImportReceiptResponse> getReceipts(Pageable pageable, Specification<StockImportReceipt> spec) {
        Page<StockImportReceipt> receiptPage = stockImportReceiptRepository.findAll(spec, pageable);
        return PageResponse.<StockImportReceiptResponse>builder()
                .currentPage(receiptPage.getNumber())
                .pageSize(receiptPage.getSize())
                .totalPages(receiptPage.getTotalPages())
                .totalElements(receiptPage.getTotalElements())
                .last(receiptPage.isLast())
                .data(receiptPage.getContent().stream().map(stockImportReceiptMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('INVENTORY:VIEW')")
    public StockImportReceiptResponse getReceiptById(String id) {
        return stockImportReceiptMapper.toResponse(findReceiptOrThrow(id));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('INVENTORY:VIEW')")
    public PageResponse<InventoryMovementResponse> getMovements(Pageable pageable, Specification<InventoryMovement> spec) {
        Page<InventoryMovement> movementPage = inventoryMovementRepository.findAll(spec, pageable);
        return PageResponse.<InventoryMovementResponse>builder()
                .currentPage(movementPage.getNumber())
                .pageSize(movementPage.getSize())
                .totalPages(movementPage.getTotalPages())
                .totalElements(movementPage.getTotalElements())
                .last(movementPage.isLast())
                .data(movementPage.getContent().stream().map(inventoryMovementMapper::toResponse).toList())
                .build();
    }

    @Transactional
    @PreAuthorize("hasAuthority('INVENTORY:CREATE')")
    public StockImportReceiptResponse createReceipt(CreateStockImportReceiptRequest request) {
        String receiptCode = resolveReceiptCode(request.getReceiptCode());
        StockImportReceipt receipt = StockImportReceipt.builder()
                .receiptCode(receiptCode)
                .supplierName(request.getSupplierName())
                .note(request.getNote())
                .importedAt(request.getImportedAt() != null ? request.getImportedAt() : LocalDateTime.now())
                .totalAmount(BigDecimal.ZERO)
                .build();
        StockImportReceipt savedReceipt = stockImportReceiptRepository.save(receipt);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateStockImportItemRequest itemRequest : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(itemRequest.getProductVariantId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
            int beforeQuantity = variant.getStockQuantity() == null ? 0 : variant.getStockQuantity();
            int importQuantity = itemRequest.getQuantity();
            int afterQuantity = beforeQuantity + importQuantity;
            BigDecimal unitCost = itemRequest.getUnitCost();
            BigDecimal lineTotal = unitCost.multiply(BigDecimal.valueOf(importQuantity));

            StockImportItem item = StockImportItem.builder()
                    .receipt(savedReceipt)
                    .productVariant(variant)
                    .quantity(importQuantity)
                    .unitCost(unitCost)
                    .lineTotal(lineTotal)
                    .build();
            savedReceipt.getItems().add(item);

            variant.setStockQuantity(afterQuantity);
            if (variant.getOriginalPrice() == null || variant.getOriginalPrice().compareTo(BigDecimal.ZERO) <= 0) {
                variant.setOriginalPrice(variant.getSalePrice());
            }
            productVariantRepository.save(variant);

            InventoryMovement movement = InventoryMovement.builder()
                    .productVariant(variant)
                    .movementType(InventoryMovementType.IMPORT)
                    .quantity(importQuantity)
                    .beforeQuantity(beforeQuantity)
                    .afterQuantity(afterQuantity)
                    .unitCost(unitCost)
                    .referenceType(InventoryReferenceType.IMPORT_RECEIPT)
                    .referenceId(savedReceipt.getId())
                    .note(savedReceipt.getNote())
                    .build();
            inventoryMovementRepository.save(movement);

            totalAmount = totalAmount.add(lineTotal);
        }

        savedReceipt.setTotalAmount(totalAmount);
        return stockImportReceiptMapper.toResponse(stockImportReceiptRepository.save(savedReceipt));
    }

    private InventoryStockResponse toStockResponse(ProductVariant variant) {
        Optional<InventoryMovement> latestImport = inventoryMovementRepository
                .findTopByProductVariantIdAndMovementTypeOrderByCreatedAtDesc(variant.getId(), InventoryMovementType.IMPORT);
        ProductColor color = variant.getProductColor();
        String imageUrl = null;
        if (color != null && color.getImages() != null) {
            imageUrl = color.getImages().stream()
                    .sorted(Comparator.comparing(ProductImage::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(null);
        }

        return InventoryStockResponse.builder()
                .productId(color != null && color.getProduct() != null ? color.getProduct().getId() : null)
                .productVariantId(variant.getId())
                .productName(color != null && color.getProduct() != null ? color.getProduct().getName() : null)
                .productSlug(color != null && color.getProduct() != null ? color.getProduct().getSlug() : null)
                .colorName(color != null ? color.getColorName() : null)
                .hexCode(color != null ? color.getHexCode() : null)
                .sizeName(variant.getSizeName())
                .imageUrl(imageUrl)
                .originalPrice(variant.getOriginalPrice())
                .salePrice(variant.getSalePrice())
                .stockQuantity(variant.getStockQuantity())
                .latestUnitCost(latestImport.map(InventoryMovement::getUnitCost).orElse(null))
                .latestImportedAt(latestImport.map(InventoryMovement::getCreatedAt).orElse(null))
                .build();
    }

    private StockImportReceipt findReceiptOrThrow(String id) {
        return stockImportReceiptRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STOCK_IMPORT_RECEIPT_NOT_FOUND));
    }

    private String resolveReceiptCode(String requestedCode) {
        if (requestedCode != null && !requestedCode.isBlank()) {
            if (stockImportReceiptRepository.existsByReceiptCode(requestedCode)) {
                throw new AppException(ErrorCode.STOCK_IMPORT_RECEIPT_CODE_ALREADY_EXISTS);
            }
            return requestedCode;
        }
        String generated = "IMP-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        if (stockImportReceiptRepository.existsByReceiptCode(generated)) {
            generated = generated + "-" + System.currentTimeMillis() % 1000;
        }
        return generated;
    }
}
