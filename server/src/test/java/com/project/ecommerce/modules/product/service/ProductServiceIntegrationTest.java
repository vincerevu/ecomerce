package com.project.ecommerce.modules.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.product.dto.request.ColorRequest;
import com.project.ecommerce.modules.product.dto.request.CreateProductRequest;
import com.project.ecommerce.modules.product.dto.request.VariantRequest;
import com.project.ecommerce.modules.product.entity.Category;
import com.project.ecommerce.modules.product.repository.CategoryRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class ProductServiceIntegrationTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    @WithMockUser(authorities = { "PRODUCT:CREATE", "PRODUCT:VIEW" })
    void createProduct_shouldPersistVariantsAndImages() {
        Category category = createCategory();
        CreateProductRequest request =
                buildRequest(category.getId(), "integration-product-" + UUID.randomUUID().toString().substring(0, 8));

        var created = productService.create(request);

        entityManager.flush();
        entityManager.clear();

        var loaded = productService.getProductById(created.getId());

        assertThat(loaded.getColors()).hasSize(1);
        assertThat(loaded.getColors().getFirst().getVariants()).hasSize(1);
        assertThat(loaded.getColors().getFirst().getVariants().getFirst().getSizeName()).isEqualTo("L");
        assertThat(loaded.getColors().getFirst().getImages()).hasSize(2);
        assertThat(loaded.getGender()).isEqualTo("UNISEX");
        assertThat(loaded.getStyle()).isEqualTo("CASUAL");
        assertThat(loaded.getColors().getFirst().getImages().getFirst().getUrl())
                .isEqualTo("https://example.com/images/one.jpg");
    }

    @Test
    @Transactional
    @WithMockUser(authorities = { "PRODUCT:CREATE" })
    void createProduct_shouldThrowMeaningfulErrorWhenSlugAlreadyExists() {
        Category category = createCategory();
        String duplicateSlug = "duplicate-slug-" + UUID.randomUUID().toString().substring(0, 8);

        productService.create(buildRequest(category.getId(), duplicateSlug));

        assertThatThrownBy(() -> productService.create(buildRequest(category.getId(), duplicateSlug)))
                .isInstanceOf(AppException.class)
                .extracting(exception -> ((AppException) exception).getErrorCode())
                .isEqualTo(ErrorCode.PRODUCT_SLUG_ALREADY_EXISTS);
    }

    @Test
    @Transactional
    @WithMockUser(authorities = { "PRODUCT:CREATE", "PRODUCT:VIEW" })
    void getProducts_shouldIncludeCreatedProductInFirstPage() {
        Category category = createCategory();
        String slug = "catalog-a-" + UUID.randomUUID().toString().substring(0, 8);
        productService.create(buildRequest(category.getId(), slug));

        entityManager.flush();
        entityManager.clear();

        var catalogPage = productService.getProducts(PageRequest.of(0, 500), null);

        assertThat(catalogPage.getData())
                .extracting(product -> product.getSlug())
                .contains(slug);
    }

    private Category createCategory() {
        return categoryRepository.save(
                Category.builder()
                        .name("Integration Category")
                        .slug("integration-category-" + UUID.randomUUID().toString().substring(0, 8))
                        .sortOrder(0)
                        .build());
    }

    private CreateProductRequest buildRequest(String categoryId, String slug) {
        return buildRequest(categoryId, slug, "Integration Product");
    }

    private CreateProductRequest buildRequest(String categoryId, String slug, String name) {
        VariantRequest variant = new VariantRequest();
        variant.setSizeName("L");
        variant.setSalePrice(BigDecimal.valueOf(199000));
        variant.setStockQuantity(12);

        ColorRequest color = new ColorRequest();
        color.setColorName("Den");
        color.setHexCode("#111111");
        color.setImageUrls(List.of(
                "https://example.com/images/one.jpg",
                "https://example.com/images/two.jpg"));
        color.setVariants(List.of(variant));

        CreateProductRequest request = new CreateProductRequest();
        request.setName(name);
        request.setSlug(slug);
        request.setDescription("Test description");
        request.setShortDescription("Short");
        request.setMaterial("Cotton");
        request.setGender("UNISEX");
        request.setStyle("CASUAL");
        request.setCategoryId(categoryId);
        request.setTagIds(Set.of());
        request.setStatus("ACTIVE");
        request.setColors(List.of(color));
        return request;
    }
}
