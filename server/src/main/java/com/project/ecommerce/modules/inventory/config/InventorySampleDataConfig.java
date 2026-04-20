package com.project.ecommerce.modules.inventory.config;

import com.project.ecommerce.modules.inventory.dto.request.CreateStockImportItemRequest;
import com.project.ecommerce.modules.inventory.dto.request.CreateStockImportReceiptRequest;
import com.project.ecommerce.modules.inventory.repository.StockImportReceiptRepository;
import com.project.ecommerce.modules.inventory.service.InventoryService;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
@RequiredArgsConstructor
public class InventorySampleDataConfig {

    private final ProductVariantRepository productVariantRepository;
    private final StockImportReceiptRepository stockImportReceiptRepository;
    private final InventoryService inventoryService;

    @Bean
    @Order(420)
    ApplicationRunner inventorySampleDataRunner() {
        return args -> {
            if (stockImportReceiptRepository.count() >= 24) {
                return;
            }

            var authentication = new UsernamePasswordAuthenticationToken(
                    "system",
                    null,
                    List.of(() -> "INVENTORY:CREATE", () -> "INVENTORY:VIEW"));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            try {
                List<ProductVariant> variants = productVariantRepository.findAll().stream()
                        .sorted(Comparator.comparing(ProductVariant::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                        .limit(48)
                        .toList();

                int targetCount = 24;
                long existingCount = stockImportReceiptRepository.count();
                for (int i = (int) existingCount; i < targetCount && !variants.isEmpty(); i++) {
                    List<CreateStockImportItemRequest> items = new ArrayList<>();
                    for (int offset = 0; offset < 2; offset++) {
                        ProductVariant variant = variants.get((i * 2 + offset) % variants.size());
                        CreateStockImportItemRequest item = new CreateStockImportItemRequest();
                        item.setProductVariantId(variant.getId());
                        item.setQuantity(8 + ((i + offset) % 5) * 4);
                        item.setUnitCost(BigDecimal.valueOf(90000L + ((i + offset) % 7) * 15000L));
                        items.add(item);
                    }

                    CreateStockImportReceiptRequest request = new CreateStockImportReceiptRequest();
                    request.setReceiptCode("IMP-SEED-" + String.format("%05d", i + 1));
                    request.setSupplierName("Nhà cung cấp " + (i + 1));
                    request.setNote("Phiếu nhập mẫu phục vụ kiểm thử kho");
                    request.setImportedAt(LocalDateTime.now().minusDays(targetCount - i));
                    request.setItems(items);
                    inventoryService.createReceipt(request);
                }
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
    }
}
