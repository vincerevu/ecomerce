package com.project.ecommerce.modules.product.service;

import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.EnabledIf;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@EnabledIf(
        expression = "#{systemProperties['yody.import.enabled'] == 'true'}",
        loadContext = true)
class YodyImportServiceIntegrationTest {

    @Autowired
    private YodyImportService yodyImportService;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void importFromSitemap_shouldPersistCleanedProductsIntoDatabase() {
        int limit = Integer.getInteger("yody.import.limit", 20);
        boolean skipExisting = Boolean.parseBoolean(System.getProperty("yody.import.skipExisting", "true"));

        long productCountBefore = productRepository.count();

        var result = yodyImportService.importFromSitemap(limit, skipExisting);

        long productCountAfter = productRepository.count();

        assertThat(result.totalRequested()).isGreaterThan(0);
        assertThat(result.createdCount() + result.updatedCount() + result.skippedCount() + result.failedCount())
                .isEqualTo(result.totalRequested());
        assertThat(productCountAfter).isGreaterThanOrEqualTo(productCountBefore);

        List<Product> importedProducts = productRepository.findBySlugIsNotNull().stream()
                .filter(this::isImportedYodyProduct)
                .toList();

        long missingCategoryCount = importedProducts.stream()
                .filter(product -> product.getCategory() == null)
                .count();
        long missingMaterialCount = importedProducts.stream()
                .filter(product -> product.getMaterial() == null || product.getMaterial().isBlank())
                .count();

        System.out.printf(
                "Yody coverage report -> products=%d, missingCategory=%d, missingMaterial=%d%n",
                importedProducts.size(),
                missingCategoryCount,
                missingMaterialCount);

        var importedProduct = importedProducts.stream()
                .filter(product -> product.getCategory() != null)
                .findFirst();

        assertThat(importedProduct).isPresent();
        assertThat(importedProduct.orElseThrow().getStatus()).isEqualTo("ACTIVE");
        assertThat(missingCategoryCount).isEqualTo(0);
        assertThat(missingMaterialCount).isEqualTo(0);
    }

    private boolean isImportedYodyProduct(Product product) {
        if (product.getSlug() == null || product.getSlug().isBlank()) {
            return false;
        }
        if (product.getName() == null || product.getName().isBlank()) {
            return false;
        }
        if (product.getDescription() == null || product.getDescription().isBlank()) {
            return false;
        }
        if (product.getColors() == null || product.getColors().isEmpty()) {
            return false;
        }

        return product.getColors().stream()
                .filter(color -> color.getImages() != null && !color.getImages().isEmpty())
                .flatMap(color -> color.getImages().stream())
                .map(image -> image.getImageUrl() == null ? "" : image.getImageUrl())
                .anyMatch(url -> url.contains("yodycdn.com"));
    }
}
