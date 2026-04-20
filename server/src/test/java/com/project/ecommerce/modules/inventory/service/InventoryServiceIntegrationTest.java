package com.project.ecommerce.modules.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.project.ecommerce.modules.inventory.dto.request.CreateStockImportItemRequest;
import com.project.ecommerce.modules.inventory.dto.request.CreateStockImportReceiptRequest;
import com.project.ecommerce.modules.inventory.enums.InventoryMovementType;
import com.project.ecommerce.modules.inventory.repository.InventoryMovementRepository;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class InventoryServiceIntegrationTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private InventoryMovementRepository inventoryMovementRepository;

    @Test
    @Transactional
    @WithMockUser(authorities = { "INVENTORY:CREATE", "INVENTORY:VIEW" })
    void createReceipt_shouldIncreaseStockAndCreateMovementLog() {
        ProductVariant variant = createVariant("Ao hoodie", "ao-hoodie", "Den", "L", 15);

        CreateStockImportItemRequest item = new CreateStockImportItemRequest();
        item.setProductVariantId(variant.getId());
        item.setQuantity(12);
        item.setUnitCost(BigDecimal.valueOf(145000));

        CreateStockImportReceiptRequest request = new CreateStockImportReceiptRequest();
        request.setReceiptCode("IMP-TEST-" + UUID.randomUUID().toString().substring(0, 8));
        request.setSupplierName("Nha cung cap test");
        request.setNote("Nhap kho test");
        request.setItems(List.of(item));

        var response = inventoryService.createReceipt(request);

        ProductVariant updatedVariant = productVariantRepository.findById(variant.getId()).orElseThrow();

        assertThat(response.getReceiptCode()).startsWith("IMP-TEST-");
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getTotalAmount()).isEqualByComparingTo("1740000");
        assertThat(updatedVariant.getStockQuantity()).isEqualTo(27);

        var latestMovement = inventoryMovementRepository
                .findTopByProductVariantIdAndMovementTypeOrderByCreatedAtDesc(
                        variant.getId(),
                        InventoryMovementType.IMPORT)
                .orElseThrow();

        assertThat(latestMovement.getBeforeQuantity()).isEqualTo(15);
        assertThat(latestMovement.getAfterQuantity()).isEqualTo(27);
        assertThat(latestMovement.getQuantity()).isEqualTo(12);
        assertThat(latestMovement.getUnitCost()).isEqualByComparingTo("145000");
    }

    private ProductVariant createVariant(String name, String slug, String colorName, String sizeName, int stockQuantity) {
        Product product = Product.builder()
                .name(name)
                .slug(slug + "-" + UUID.randomUUID())
                .description("Inventory test product")
                .shortDescription("Inventory test product")
                .material("Cotton")
                .status("ACTIVE")
                .colors(new ArrayList<>())
                .build();

        ProductColor color = ProductColor.builder()
                .product(product)
                .colorName(colorName)
                .hexCode("#111111")
                .images(new ArrayList<>())
                .variants(new ArrayList<>())
                .build();

        ProductVariant variant = ProductVariant.builder()
                .productColor(color)
                .sizeName(sizeName)
                .originalPrice(BigDecimal.valueOf(329000))
                .salePrice(BigDecimal.valueOf(289000))
                .stockQuantity(stockQuantity)
                .build();

        color.getVariants().add(variant);
        product.getColors().add(color);

        Product savedProduct = productRepository.save(product);
        return productVariantRepository.findById(savedProduct.getColors().get(0).getVariants().get(0).getId()).orElseThrow();
    }
}
