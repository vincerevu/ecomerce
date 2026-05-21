package com.project.ecommerce.modules.product.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.product.dto.request.CreateProductRequest;
import com.project.ecommerce.modules.product.dto.request.ColorRequest;
import com.project.ecommerce.modules.product.dto.response.ProductColorSummaryResponse;
import com.project.ecommerce.modules.product.dto.response.ProductListResponse;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    public PageResponse<ProductListResponse> getProducts(Pageable pageable, Specification<Product> spec) {
        Pageable effectivePageable = pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> productPage = productRepository.findAll(spec, effectivePageable);
        List<ProductListResponse> products = buildProductListResponses(productPage.getContent());
        return PageResponse.<ProductListResponse>builder()
                .currentPage(effectivePageable.getPageNumber())
                .pageSize(effectivePageable.getPageSize())
                .totalPages(productPage.getTotalPages())
                .totalElements(productPage.getTotalElements())
                .last(productPage.isLast())
                .data(products)
                .build();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(String id) {
        Product product = productRepository.findDetailById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return productMapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findDetailBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return productMapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getProductDetailsByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        Map<String, Product> productsById = productRepository.findDetailsByIds(ids).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        return ids.stream()
                .map(productsById::get)
                .filter(Objects::nonNull)
                .map(productMapper::toResponse)
                .toList();
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

    private List<ProductListResponse> buildProductListResponses(List<Product> pagedProducts) {
        if (pagedProducts.isEmpty()) {
            return List.of();
        }

        List<String> ids = pagedProducts.stream()
                .map(Product::getId)
                .toList();

        Map<String, ProductRepository.ProductListBaseView> baseById = productRepository.findListBaseByIds(ids)
                .stream()
                .collect(Collectors.toMap(ProductRepository.ProductListBaseView::getId, Function.identity()));

        Map<String, List<ProductColorSummaryResponse>> colorsByProductId = productRepository
                .findColorSummariesByProductIds(ids)
                .stream()
                .collect(Collectors.groupingBy(
                        ProductRepository.ProductColorSummaryView::getProductId,
                        Collectors.mapping(this::toColorSummaryResponse, Collectors.toList())));

        Map<String, ProductRepository.ProductPriceStockView> priceStockByProductId = productRepository
                .findPriceStockByProductIds(ids)
                .stream()
                .collect(Collectors.toMap(ProductRepository.ProductPriceStockView::getProductId, Function.identity()));

        Map<String, String> thumbnailByProductId = new LinkedHashMap<>();
        productRepository.findThumbnailCandidatesByProductIds(ids).forEach(candidate -> {
            if (candidate.getImageUrl() != null && !candidate.getImageUrl().isBlank()) {
                thumbnailByProductId.putIfAbsent(candidate.getProductId(), candidate.getImageUrl());
            }
        });

        return ids.stream()
                .map(id -> toProductListResponse(
                        baseById.get(id),
                        colorsByProductId.getOrDefault(id, List.of()),
                        priceStockByProductId.get(id),
                        thumbnailByProductId.get(id)))
                .filter(Objects::nonNull)
                .toList();
    }

    private ProductListResponse toProductListResponse(
            ProductRepository.ProductListBaseView base,
            List<ProductColorSummaryResponse> colors,
            ProductRepository.ProductPriceStockView priceStock,
            String thumbnailUrl) {
        if (base == null) {
            return null;
        }

        BigDecimal displayPrice = priceStock != null ? priceStock.getDisplayPrice() : BigDecimal.ZERO;
        BigDecimal minOriginalPrice = priceStock != null ? priceStock.getMinOriginalPrice() : BigDecimal.ZERO;
        BigDecimal displayOriginalPrice = minOriginalPrice != null
                && displayPrice != null
                && minOriginalPrice.compareTo(displayPrice) > 0
                        ? minOriginalPrice
                        : null;
        Integer totalStock = priceStock != null && priceStock.getTotalStock() != null
                ? priceStock.getTotalStock().intValue()
                : 0;
        Integer variantCount = priceStock != null && priceStock.getVariantCount() != null
                ? priceStock.getVariantCount().intValue()
                : 0;

        return ProductListResponse.builder()
                .id(base.getId())
                .name(base.getName())
                .slug(base.getSlug())
                .shortDescription(base.getShortDescription())
                .categoryId(base.getCategoryId())
                .categoryName(base.getCategoryName())
                .categorySlug(base.getCategorySlug())
                .thumbnailUrl(thumbnailUrl)
                .minOriginalPrice(minOriginalPrice)
                .minSalePrice(displayPrice)
                .displayPrice(displayPrice)
                .displayOriginalPrice(displayOriginalPrice)
                .totalStock(totalStock)
                .variantCount(variantCount)
                .status(base.getStatus())
                .createdAt(base.getCreatedAt())
                .colors(colors)
                .build();
    }

    private ProductColorSummaryResponse toColorSummaryResponse(ProductRepository.ProductColorSummaryView view) {
        return ProductColorSummaryResponse.builder()
                .id(view.getId())
                .colorName(view.getColorName())
                .hexCode(view.getHexCode())
                .build();
    }
}
