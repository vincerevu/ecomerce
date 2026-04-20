package com.project.ecommerce.modules.product.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.product.dto.request.CreateProductRequest;
import com.project.ecommerce.modules.product.dto.request.ColorRequest;
import com.project.ecommerce.modules.product.dto.response.ProductResponse;
import com.project.ecommerce.modules.product.entity.*;
import com.project.ecommerce.modules.product.mapper.ProductColorMapper;
import com.project.ecommerce.modules.product.mapper.ProductMapper;
import com.project.ecommerce.modules.product.repository.CategoryRepository;
import com.project.ecommerce.modules.product.repository.ProductImageRepository;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import com.project.ecommerce.modules.product.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.ArrayList;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductMapper productMapper;
    private final ProductColorMapper productColorMapper;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(Pageable pageable, Specification<Product> spec) {
        Page<Product> productPage = productRepository.findAll(spec, pageable);
        return PageResponse.<ProductResponse>builder()
                .currentPage(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalPages(productPage.getTotalPages())
                .totalElements(productPage.getTotalElements())
                .last(productPage.isLast())
                .data(productPage.getContent().stream().map(productMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(String id) {
        Product product = productRepository.findOneById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return productMapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findOneBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return productMapper.toResponse(product);
    }

    @Transactional
    @PreAuthorize("hasAuthority('PRODUCT:CREATE')")
    public ProductResponse create(CreateProductRequest req) {
        validateUniqueSlug(req.getSlug(), null);
        Product product = productMapper.toEntity(req);
        applyRelations(product, req);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    @PreAuthorize("hasAuthority('PRODUCT:UPDATE')")
    public ProductResponse update(String id, CreateProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        validateUniqueSlug(req.getSlug(), id);
        productMapper.updateProduct(product, req);
        applyRelations(product, req);

        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    @PreAuthorize("hasAuthority('PRODUCT:UPDATE')")
    public ProductResponse updateStatus(String id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setStatus(status);
        return productMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    @PreAuthorize("hasAuthority('PRODUCT:DELETE')")
    public void delete(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setIsDeleted(true);
        productRepository.save(product);
    }

    private void applyRelations(Product product, CreateProductRequest req) {
        applyCategory(product, req.getCategoryId());
        applyTags(product, req.getTagIds());
        applyColors(product, req);
    }

    private void applyCategory(Product product, String categoryId) {
        if (categoryId != null && !categoryId.isBlank()) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
    }

    private void applyTags(Product product, Set<String> tagIds) {
        if (tagIds == null || tagIds.isEmpty()) {
            if (product.getTags() != null) {
                product.getTags().clear();
            }
            return;
        }
        if (product.getTags() == null) {
            product.setTags(new HashSet<>());
        }
        product.getTags().clear();
        product.getTags().addAll(tagRepository.findAllById(tagIds));
    }

    private void applyColors(Product product, CreateProductRequest req) {
        if (req.getColors() == null || req.getColors().isEmpty()) {
            if (product.getColors() != null) {
                product.getColors().clear();
            }
            return;
        }

        if (product.getColors() == null) {
            product.setColors(new ArrayList<>());
        } else {
            product.getColors().clear();
        }

        req.getColors().forEach(colorReq -> {
            ProductColor color = productColorMapper.toEntity(colorReq);
            color.setProduct(product);
            color.setIsDeleted(false);
            normalizeVariants(color);
            normalizeImages(color, colorReq);
            product.getColors().add(color);
        });
    }

    private void normalizeVariants(ProductColor color) {
        List<ProductVariant> variants = color.getVariants() == null
                ? new ArrayList<>()
                : new ArrayList<>(color.getVariants());

        variants.forEach(variant -> {
            variant.setProductColor(color);
            variant.setIsDeleted(false);
        });

        color.setVariants(variants);
    }

    private void normalizeImages(ProductColor color, ColorRequest colorReq) {
        List<ProductImage> images = new ArrayList<>();

        if (colorReq.getImageUrls() != null) {
            for (int i = 0; i < colorReq.getImageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .imageUrl(colorReq.getImageUrls().get(i))
                        .isMain(colorReq.getMainImageIndex() != null ? i == colorReq.getMainImageIndex() : i == 0)
                        .sortOrder(i)
                        .productColor(color)
                        .isDeleted(false)
                        .build();
                images.add(image);
            }
        }

        color.setImages(images);
    }

    private void validateUniqueSlug(String slug, String excludedProductId) {
        if (slug == null || slug.isBlank()) {
            return;
        }

        boolean slugExists = excludedProductId == null
                ? productRepository.existsBySlug(slug)
                : productRepository.existsBySlugAndIdNot(slug, excludedProductId);

        if (slugExists) {
            throw new AppException(ErrorCode.PRODUCT_SLUG_ALREADY_EXISTS);
        }
    }
}
