package com.project.ecommerce.modules.collection.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.collection.dto.request.CreateProductCollectionRequest;
import com.project.ecommerce.modules.collection.dto.request.UpdateProductCollectionRequest;
import com.project.ecommerce.modules.collection.dto.response.CollectionShowcaseProductColorResponse;
import com.project.ecommerce.modules.collection.dto.response.CollectionShowcaseProductImageResponse;
import com.project.ecommerce.modules.collection.dto.response.CollectionShowcaseProductResponse;
import com.project.ecommerce.modules.collection.dto.response.CollectionShowcaseProductVariantResponse;
import com.project.ecommerce.modules.collection.dto.response.CollectionShowcaseResponse;
import com.project.ecommerce.modules.collection.dto.response.ProductCollectionProductResponse;
import com.project.ecommerce.modules.collection.dto.response.ProductCollectionResponse;
import com.project.ecommerce.modules.collection.entity.ProductCollection;
import com.project.ecommerce.modules.collection.repository.ProductCollectionRepository;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.dto.response.ProductResponse;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductColorRepository;
import com.project.ecommerce.modules.product.repository.ProductImageRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import com.project.ecommerce.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.Collection;
import java.util.Collections;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Pageable;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductCollectionService {
    private final ProductCollectionRepository productCollectionRepository;
    private final ProductRepository productRepository;
    private final ProductColorRepository productColorRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public List<ProductCollectionResponse> getCollections() {
        return productCollectionRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .map(collection -> toResponse(collection, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductCollectionResponse> getPage(Specification<ProductCollection> spec, Pageable pageable) {
        Page<ProductCollection> collectionPage = productCollectionRepository.findAll(spec, pageable);
        return PageResponse.<ProductCollectionResponse>builder()
                .currentPage(collectionPage.getNumber())
                .pageSize(collectionPage.getSize())
                .totalPages(collectionPage.getTotalPages())
                .totalElements(collectionPage.getTotalElements())
                .last(collectionPage.isLast())
                .data(collectionPage.getContent().stream().map(collection -> toResponse(collection, false)).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductCollectionResponse getById(String id) {
        return toResponse(findOrThrow(id), true);
    }

    @Transactional
    @PreAuthorize("hasAuthority('COLLECTION:CREATE')")
    public ProductCollectionResponse create(CreateProductCollectionRequest request) {
        String normalizedSlug = normalizeSlug(request.getSlug());
        if (productCollectionRepository.existsBySlug(normalizedSlug)) {
            throw new AppException(ErrorCode.COLLECTION_SLUG_ALREADY_EXISTS);
        }

        ProductCollection collection = ProductCollection.builder().build();
        applyRequest(collection, normalizedSlug, request.getName(), request.getSeoTitle(), request.getSeoDescription(),
                request.getCanonicalUrl(), request.getSourceUrl(), request.getCoverMediaUrl(), request.getSortOrder(),
                request.getStatus(), request.getProductCount(), request.getProductIds());
        return toResponse(productCollectionRepository.save(collection), true);
    }

    @Transactional
    @PreAuthorize("hasAuthority('COLLECTION:UPDATE')")
    public ProductCollectionResponse update(String id, UpdateProductCollectionRequest request) {
        ProductCollection collection = findOrThrow(id);
        String normalizedSlug = normalizeSlug(request.getSlug());
        if (productCollectionRepository.existsBySlugAndIdNot(normalizedSlug, id)) {
            throw new AppException(ErrorCode.COLLECTION_SLUG_ALREADY_EXISTS);
        }

        applyRequest(collection, normalizedSlug, request.getName(), request.getSeoTitle(), request.getSeoDescription(),
                request.getCanonicalUrl(), request.getSourceUrl(), request.getCoverMediaUrl(), request.getSortOrder(),
                request.getStatus(), request.getProductCount(), request.getProductIds());
        return toResponse(productCollectionRepository.save(collection), true);
    }

    @Transactional
    @PreAuthorize("hasAuthority('COLLECTION:DELETE')")
    public void delete(String id) {
        ProductCollection collection = findOrThrow(id);
        collection.setIsDeleted(true);
        productCollectionRepository.save(collection);
    }

    @Transactional(readOnly = true)
    public List<CollectionShowcaseResponse> getCollectionShowcases(int limit, int productLimit) {
        int safeLimit = Math.max(limit, 1);
        int safeProductLimit = Math.max(productLimit, 1);

        List<ProductCollection> collections = productCollectionRepository
                .findByStatusTrueOrderBySortOrderAscNameAsc(PageRequest.of(0, safeLimit));

        Map<String, List<Product>> previewProductsByCollection = new LinkedHashMap<>();
        Map<String, Product> previewProductsById = new LinkedHashMap<>();

        for (ProductCollection collection : collections) {
            List<Product> previewProducts = getSortedProducts(collection).stream()
                    .limit(safeProductLimit)
                    .toList();

            previewProductsByCollection.put(collection.getId(), previewProducts);
            previewProducts.forEach(product -> previewProductsById.put(product.getId(), product));
        }

        ProductPreviewBundle previewBundle = loadProductPreviewBundle(previewProductsById.keySet());

        return collections.stream()
                .map(collection -> toShowcase(
                        collection,
                        previewProductsByCollection.getOrDefault(collection.getId(), Collections.emptyList()),
                        previewBundle))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getCollectionProducts(String slug, Pageable pageable) {
        ProductCollection collection = productCollectionRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        List<Product> sortedProducts = getSortedProducts(collection);
        int pageSize = Math.max(pageable.getPageSize(), 1);
        int currentPage = Math.max(pageable.getPageNumber(), 0);
        int totalElements = sortedProducts.size();
        int totalPages = totalElements == 0 ? 1 : (int) Math.ceil((double) totalElements / pageSize);
        int fromIndex = Math.min(currentPage * pageSize, totalElements);
        int toIndex = Math.min(fromIndex + pageSize, totalElements);

        List<ProductResponse> data = sortedProducts.subList(fromIndex, toIndex).stream()
                .map(product -> productService.getProductById(product.getId()))
                .toList();

        return PageResponse.<ProductResponse>builder()
                .currentPage(currentPage)
                .pageSize(pageSize)
                .totalPages(totalPages)
                .totalElements(totalElements)
                .last(currentPage >= totalPages - 1)
                .data(data)
                .build();
    }

    private ProductCollectionResponse toResponse(ProductCollection collection, boolean includeProducts) {
        List<ProductCollectionProductResponse> products = includeProducts
                ? getSortedProducts(collection).stream().map(this::toCollectionProductResponse).toList()
                : null;

        return ProductCollectionResponse.builder()
                .id(collection.getId())
                .name(collection.getName())
                .slug(collection.getSlug())
                .seoTitle(collection.getSeoTitle())
                .seoDescription(collection.getSeoDescription())
                .canonicalUrl(collection.getCanonicalUrl())
                .sourceUrl(collection.getSourceUrl())
                .coverMediaUrl(collection.getCoverMediaUrl())
                .coverMediaType(collection.getCoverMediaType())
                .productCount(collection.getProductCount())
                .linkedProductCount(collection.getProducts() == null ? 0 : collection.getProducts().size())
                .sortOrder(collection.getSortOrder())
                .status(collection.getStatus())
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .products(products)
                .build();
    }

    private ProductCollectionProductResponse toCollectionProductResponse(Product product) {
        return ProductCollectionProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .status(product.getStatus())
                .imageUrl(extractPrimaryImageUrl(product))
                .build();
    }

    private CollectionShowcaseResponse toShowcase(
            ProductCollection collection,
            List<Product> previewSourceProducts,
            ProductPreviewBundle previewBundle) {
        List<Product> sortedProducts = getSortedProducts(collection);
        List<CollectionShowcaseProductResponse> previewProducts = previewSourceProducts.stream()
                .map(product -> toShowcaseProduct(product, previewBundle))
                .toList();
        int previewPageCount = previewProducts.isEmpty() ? 1 : (int) Math.ceil((double) previewProducts.size() / 5.0);

        return CollectionShowcaseResponse.builder()
                .id(collection.getId())
                .name(collection.getName())
                .slug(collection.getSlug())
                .seoTitle(collection.getSeoTitle())
                .seoDescription(collection.getSeoDescription())
                .sourceUrl(collection.getSourceUrl())
                .coverMediaUrl(collection.getCoverMediaUrl())
                .coverMediaType(collection.getCoverMediaType())
                .productCount(collection.getProductCount())
                .linkedProductCount(sortedProducts.size())
                .previewPageCount(previewPageCount)
                .products(previewProducts)
                .build();
    }

    private CollectionShowcaseProductResponse toShowcaseProduct(Product product, ProductPreviewBundle previewBundle) {
        List<ProductColor> colors = previewBundle.colorsByProductId().getOrDefault(product.getId(), Collections.emptyList());

        return CollectionShowcaseProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .createdAt(product.getCreatedAt())
                .status(product.getStatus())
                .colors(colors.stream()
                        .map(color -> CollectionShowcaseProductColorResponse.builder()
                                .id(color.getId())
                                .colorName(color.getColorName())
                                .hexCode(color.getHexCode())
                                .images(previewBundle.imagesByColorId().getOrDefault(color.getId(), Collections.emptyList()).stream()
                                        .map(image -> CollectionShowcaseProductImageResponse.builder()
                                                .id(image.getId())
                                                .url(image.getImageUrl())
                                                .isMain(image.isMain())
                                                .build())
                                        .toList())
                                .variants(previewBundle.variantsByColorId().getOrDefault(color.getId(), Collections.emptyList()).stream()
                                        .map(variant -> CollectionShowcaseProductVariantResponse.builder()
                                                .id(variant.getId())
                                                .sizeName(variant.getSizeName())
                                                .originalPrice(variant.getOriginalPrice())
                                                .salePrice(variant.getSalePrice())
                                                .stockQuantity(variant.getStockQuantity())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }

    private List<Product> getSortedProducts(ProductCollection collection) {
        return collection.getProducts().stream()
                .filter(product -> !Boolean.TRUE.equals(product.getIsDeleted()))
                .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Product::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private String extractPrimaryImageUrl(Product product) {
        if (product.getColors() == null) {
            return null;
        }

        return product.getColors().stream()
                .filter(color -> color.getImages() != null && !color.getImages().isEmpty())
                .flatMap(color -> color.getImages().stream())
                .sorted(Comparator.comparing(ProductImage::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(ProductImage::getImageUrl)
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(null);
    }

    private ProductCollection findOrThrow(String id) {
        return productCollectionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
    }

    private String normalizeSlug(String slug) {
        return slug == null ? "" : slug.trim().toLowerCase(Locale.ROOT);
    }

    private void applyRequest(
            ProductCollection collection,
            String normalizedSlug,
            String name,
            String seoTitle,
            String seoDescription,
            String canonicalUrl,
            String sourceUrl,
            String coverMediaUrl,
            Integer sortOrder,
            Boolean status,
            Integer productCount,
            List<String> productIds) {
        List<Product> linkedProducts = resolveProducts(productIds);
        int linkedProductCount = linkedProducts.size();
        String canonical = StringUtils.hasText(canonicalUrl) ? canonicalUrl.trim() : "/collections/" + normalizedSlug;
        String source = StringUtils.hasText(sourceUrl) ? sourceUrl.trim() : canonical;

        collection.setName(name == null ? null : name.trim());
        collection.setSlug(normalizedSlug);
        collection.setSeoTitle(StringUtils.hasText(seoTitle) ? seoTitle.trim() : name);
        collection.setSeoDescription(StringUtils.hasText(seoDescription) ? seoDescription.trim() : null);
        collection.setCanonicalUrl(canonical);
        collection.setSourceUrl(source);
        collection.setCoverMediaUrl(StringUtils.hasText(coverMediaUrl) ? coverMediaUrl.trim() : null);
        collection.setCoverMediaType(detectMediaType(coverMediaUrl));
        collection.setSortOrder(sortOrder == null ? 0 : sortOrder);
        collection.setStatus(status == null ? Boolean.TRUE : status);
        collection.setProductCount(productCount == null ? linkedProductCount : productCount);
        collection.getProducts().clear();
        collection.getProducts().addAll(new HashSet<>(linkedProducts));
    }

    private List<Product> resolveProducts(List<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> normalizedIds = productIds.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();

        if (normalizedIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Product> products = productRepository.findByIdIn(normalizedIds).stream()
                .filter(product -> !Boolean.TRUE.equals(product.getIsDeleted()))
                .collect(Collectors.toCollection(ArrayList::new));

        Set<String> foundIds = products.stream().map(Product::getId).collect(Collectors.toSet());
        if (foundIds.size() != normalizedIds.size()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        return normalizedIds.stream()
                .map(productMap::get)
                .toList();
    }

    private String detectMediaType(String coverMediaUrl) {
        if (!StringUtils.hasText(coverMediaUrl)) {
            return null;
        }

        String normalizedUrl = coverMediaUrl.trim().toLowerCase(Locale.ROOT);
        if (normalizedUrl.matches(".*\\.(mp4|webm|mov)(\\?.*)?$")) {
            return "video";
        }

        return "image";
    }

    private ProductPreviewBundle loadProductPreviewBundle(Collection<String> productIds) {
        if (productIds.isEmpty()) {
            return new ProductPreviewBundle(Collections.emptyMap(), Collections.emptyMap(), Collections.emptyMap());
        }

        List<ProductColor> colors = productColorRepository.findByProductIdIn(productIds);
        List<String> colorIds = colors.stream()
                .map(ProductColor::getId)
                .toList();

        Map<String, List<ProductColor>> colorsByProductId = colors.stream()
                .collect(Collectors.groupingBy(color -> color.getProduct().getId(), LinkedHashMap::new, Collectors.toList()));

        if (colorIds.isEmpty()) {
            return new ProductPreviewBundle(colorsByProductId, Collections.emptyMap(), Collections.emptyMap());
        }

        Map<String, List<ProductImage>> imagesByColorId = productImageRepository.findByProductColorIdInOrderBySortOrderAsc(colorIds).stream()
                .collect(Collectors.groupingBy(image -> image.getProductColor().getId(), LinkedHashMap::new, Collectors.toList()));

        Map<String, List<ProductVariant>> variantsByColorId = productVariantRepository.findByProductColorIdInOrderBySizeNameAsc(colorIds).stream()
                .collect(Collectors.groupingBy(variant -> variant.getProductColor().getId(), LinkedHashMap::new, Collectors.toList()));

        return new ProductPreviewBundle(colorsByProductId, imagesByColorId, variantsByColorId);
    }

    private record ProductPreviewBundle(
            Map<String, List<ProductColor>> colorsByProductId,
            Map<String, List<ProductImage>> imagesByColorId,
            Map<String, List<ProductVariant>> variantsByColorId) {
    }
}
