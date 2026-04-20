package com.project.ecommerce.modules.product.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.ecommerce.modules.product.entity.Category;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.CategoryRepository;
import com.project.ecommerce.modules.product.repository.ProductColorRepository;
import com.project.ecommerce.modules.product.repository.ProductImageRepository;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class YodyImportService {
    private static final String SITEMAP_URL = "https://yody.vn/sitemap_products_1.xml";
    private static final Pattern PRODUCT_URL_PATTERN = Pattern.compile("<loc>(https://yody\\.vn/product/[^<]+)</loc>");
    private static final Pattern PDP_DATA_PATTERN = Pattern.compile(
            "self\\.PDPData\\s*=\\s*(\".*?\")\\s*(?:self\\.currentVariant|self\\.categories)\\s*=",
            Pattern.DOTALL);
    private static final Pattern CATEGORIES_PATTERN = Pattern.compile(
            "self\\.categories\\s*=\\s*(\\[.*\\])\\s*$",
            Pattern.DOTALL);
    private static final Pattern TAG_PATTERN = Pattern.compile("<[^>]+>");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");
    private static final String YODY_IMAGE_BASE = "https://buggy.yodycdn.com/images/";

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductColorRepository productColorRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public YodyImportResult importFromSitemap(Integer limit, boolean skipExisting) {
        List<String> productUrls = fetchProductUrls(limit);
        Map<String, YodyCategoryNode> categoryTree = fetchCategoryTree(productUrls);
        seedCategories(categoryTree);

        AtomicInteger createdCount = new AtomicInteger();
        AtomicInteger updatedCount = new AtomicInteger();
        AtomicInteger skippedCount = new AtomicInteger();
        AtomicInteger failedCount = new AtomicInteger();

        for (int index = 0; index < productUrls.size(); index++) {
            String productUrl = productUrls.get(index);
            try {
                ImportAction action = transactionTemplate.execute(status -> {
                    try {
                        return importProduct(productUrl, skipExisting);
                    } catch (IOException | InterruptedException exception) {
                        throw new IllegalStateException("Failed to import product " + productUrl, exception);
                    }
                });
                if (action == null) {
                    throw new IllegalStateException("Yody import transaction returned no result");
                }
                switch (action) {
                    case CREATED -> createdCount.incrementAndGet();
                    case UPDATED -> updatedCount.incrementAndGet();
                    case SKIPPED -> skippedCount.incrementAndGet();
                }

                if ((index + 1) % 25 == 0 || index == productUrls.size() - 1) {
                    log.info(
                            "Yody import progress: {}/{} processed (created={}, updated={}, skipped={}, failed={})",
                            index + 1,
                            productUrls.size(),
                            createdCount.get(),
                            updatedCount.get(),
                            skippedCount.get(),
                failedCount.get());
                }
                Thread.sleep(80L);
            } catch (Exception exception) {
                failedCount.incrementAndGet();
                log.warn("Failed to import Yody product {}: {}", productUrl, exception.getMessage());
            }
        }

        return new YodyImportResult(
                productUrls.size(),
                createdCount.get(),
                updatedCount.get(),
                skippedCount.get(),
                failedCount.get());
    }

    private List<String> fetchProductUrls(Integer limit) {
        String xml = getBody(SITEMAP_URL);
        Matcher matcher = PRODUCT_URL_PATTERN.matcher(xml);
        List<String> urls = new ArrayList<>();

        while (matcher.find()) {
            urls.add(matcher.group(1));
            if (limit != null && limit > 0 && urls.size() >= limit) {
                break;
            }
        }

        return urls;
    }

    private Map<String, YodyCategoryNode> fetchCategoryTree(List<String> productUrls) {
        if (productUrls.isEmpty()) {
            return Map.of();
        }

        String html = getBody(productUrls.getFirst());
        Matcher matcher = CATEGORIES_PATTERN.matcher(extractInlineScript(html));
        if (!matcher.find()) {
            return Map.of();
        }

        try {
            List<YodyCategoryNode> categories = objectMapper.readValue(
                    matcher.group(1),
                    new TypeReference<List<YodyCategoryNode>>() {});
            Map<String, YodyCategoryNode> flatMap = new LinkedHashMap<>();
            categories.forEach(category -> flattenCategories(category, null, flatMap));
            return flatMap;
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to parse Yody category tree", exception);
        }
    }

    private void flattenCategories(
            YodyCategoryNode node,
            YodyCategoryNode parent,
            Map<String, YodyCategoryNode> flatMap) {
        if (node == null || node.slug() == null || node.slug().isBlank()) {
            return;
        }

        flatMap.put(node.slug(), parent == null ? node : node.withParent(parent.slug()));
        if (node.children() != null) {
            node.children().forEach(child -> flattenCategories(child, node, flatMap));
        }
    }

    private void seedCategories(Map<String, YodyCategoryNode> categoryTree) {
        categoryTree.values().stream()
                .sorted(Comparator.comparingInt(YodyCategoryNode::level).thenComparing(YodyCategoryNode::position))
                .forEach(node -> {
                    Category category = categoryRepository.findBySlug(node.slug())
                            .orElseGet(Category::new);
                    String normalizedIconUrl = normalizeAssetUrl(node.iconUrl());
                    category.setName(cleanText(node.name()));
                    category.setSlug(node.slug());
                    category.setDescription(cleanText(Optional.ofNullable(node.seoTitle()).orElse(node.name())));
                    if (!normalizedIconUrl.isBlank() || category.getIconUrl() == null || category.getIconUrl().isBlank()) {
                        category.setIconUrl(normalizedIconUrl);
                    }
                    category.setSortOrder(node.position());
                    if (node.parentSlug() != null && !node.parentSlug().isBlank()) {
                        categoryRepository.findBySlug(node.parentSlug()).ifPresent(category::setParent);
                    } else {
                        category.setParent(null);
                    }
                    categoryRepository.save(category);
                });
    }

    private ImportAction importProduct(String productUrl, boolean skipExisting) throws IOException, InterruptedException {
        String html = getBody(productUrl);
        String script = extractInlineScript(html);
        Matcher matcher = PDP_DATA_PATTERN.matcher(script);
        if (!matcher.find()) {
            throw new IllegalStateException("Missing PDPData payload");
        }

        JsonNode pdpData = objectMapper.readTree(objectMapper.readValue(matcher.group(1), String.class));
        String slug = extractSlug(productUrl, pdpData.path("url_handle").asText(null));

        Optional<Product> existingProduct = productRepository.findBySlug(slug);
        if (existingProduct.isPresent() && skipExisting) {
            return ImportAction.SKIPPED;
        }

        Product product = existingProduct.orElseGet(Product::new);
        product.setName(cleanText(pdpData.path("name").asText()));
        product.setSlug(slug);
        product.setDescription(cleanDescription(pdpData.path("description").asText("")));
        product.setShortDescription(buildShortDescription(
                pdpData.path("seo_description").asText(""),
                product.getDescription()));
        product.setMaterial(buildMaterialText(pdpData.path("material"), product.getDescription()));
        product.setGender(deriveGender(pdpData.path("category").path("slug").asText(""), product.getName()));
        product.setStyle(deriveStyle(product.getName(), pdpData.path("category").path("slug").asText("")));
        product.setStatus("ACTIVE");
        resolveProductCategory(pdpData.path("category"))
                .ifPresent(category -> {
                    assignProductCategory(product, category);
                    String categoryIconUrl = normalizeAssetUrl(pdpData.path("category").path("icon_url").asText(""));
                    if (!categoryIconUrl.isBlank() && (category.getIconUrl() == null || category.getIconUrl().isBlank())) {
                        category.setIconUrl(categoryIconUrl);
                        categoryRepository.save(category);
                    }
                });

        product.setTags(new java.util.HashSet<>());
        List<ProductColor> importedColors = buildColors(product, pdpData.path("variants"));
        String primaryImageUrl = resolveFirstImageUrl(importedColors);
        replaceColors(product, existingProduct, importedColors);
        productRepository.save(product);
        assignCategoryIconIfMissing(product.getCategory(), primaryImageUrl);

        return existingProduct.isPresent() ? ImportAction.UPDATED : ImportAction.CREATED;
    }

    private void assignProductCategory(Product product, Category category) {
        Category resolvedCategory = category;

        if (resolvedCategory.getParent() != null && !hasCategoryChildren(resolvedCategory)) {
            resolvedCategory = resolvedCategory.getParent();
        }

        product.setCategory(resolvedCategory);
    }

    private Optional<Category> resolveProductCategory(JsonNode categoryNode) {
        if (categoryNode == null || categoryNode.isMissingNode()) {
            return Optional.empty();
        }

        String slug = cleanText(categoryNode.path("slug").asText(""));
        if (slug.isBlank()) {
            return Optional.empty();
        }

        Category category = categoryRepository.findBySlug(slug).orElseGet(Category::new);
        if (category.getSlug() == null || category.getSlug().isBlank()) {
            category.setSlug(slug);
        }

        String name = cleanText(categoryNode.path("name").asText(""));
        if (!name.isBlank()) {
            category.setName(name);
        } else if (category.getName() == null || category.getName().isBlank()) {
            category.setName(slug);
        }

        if (category.getDescription() == null || category.getDescription().isBlank()) {
            category.setDescription(category.getName());
        }

        String iconUrl = normalizeAssetUrl(categoryNode.path("icon_url").asText(""));
        if (!iconUrl.isBlank() && (category.getIconUrl() == null || category.getIconUrl().isBlank())) {
            category.setIconUrl(iconUrl);
        }

        return Optional.of(categoryRepository.save(category));
    }

    private boolean hasCategoryChildren(Category category) {
        if (category == null || category.getId() == null) {
            return false;
        }

        return categoryRepository.existsByParentId(category.getId());
    }

    private void assignCategoryIconIfMissing(Category category, String imageUrl) {
        if (category == null || category.getId() == null || imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        Category current = categoryRepository.findById(category.getId()).orElse(null);
        while (current != null) {
            if (current.getIconUrl() == null || current.getIconUrl().isBlank()) {
                current.setIconUrl(imageUrl);
                categoryRepository.save(current);
            }
            String parentId = current.getParent() == null ? null : current.getParent().getId();
            current = parentId == null ? null : categoryRepository.findById(parentId).orElse(null);
        }
    }

    private String resolveFirstImageUrl(List<ProductColor> colors) {
        if (colors == null) {
            return "";
        }

        return colors.stream()
                .filter(color -> color.getImages() != null && !color.getImages().isEmpty())
                .flatMap(color -> color.getImages().stream())
                .map(ProductImage::getImageUrl)
                .filter(url -> url != null && !url.isBlank())
                .findFirst()
                .orElse("");
    }

    private void replaceColors(Product product, Optional<Product> existingProduct, List<ProductColor> importedColors) {
        if (existingProduct.isPresent() && existingProduct.get().getId() != null) {
            String productId = existingProduct.get().getId();
            productImageRepository.deleteByProductColorProductId(productId);
            productVariantRepository.deleteByProductColorProductId(productId);
            productColorRepository.deleteByProductId(productId);
        }

        if (product.getColors() == null) {
            product.setColors(new ArrayList<>());
        } else {
            product.getColors().clear();
        }
        product.getColors().addAll(importedColors);
    }

    private List<ProductColor> buildColors(Product product, JsonNode variantsNode) {
        Map<String, ProductColor> colorMap = new LinkedHashMap<>();

        if (variantsNode.isArray()) {
            for (JsonNode variantNode : variantsNode) {
                JsonNode colorNode = variantNode.path("color");
                String colorCode = colorNode.path("code").asText("default");

                ProductColor color = colorMap.computeIfAbsent(colorCode, key -> {
                    ProductColor productColor = ProductColor.builder()
                            .product(product)
                            .colorName(cleanText(colorNode.path("name").asText("Mặc định")))
                            .hexCode(normalizeHex(colorNode.path("hex").asText("#111111")))
                            .images(new ArrayList<>())
                            .variants(new ArrayList<>())
                            .build();
                    productColor.setIsDeleted(false);
                    return productColor;
                });

                ProductVariant variant = ProductVariant.builder()
                        .productColor(color)
                        .sizeName(cleanText(variantNode.path("size").path("name").asText("One size")))
                        .originalPrice(normalizePrice(variantNode.path("original_price").asText()))
                        .salePrice(normalizePrice(variantNode.path("sale_price").asText()))
                        .stockQuantity(variantNode.path("inventory").asInt(0))
                        .build();
                variant.setIsDeleted(false);
                color.getVariants().add(variant);

                if (variantNode.path("images").isArray()) {
                    variantNode.path("images").forEach(imageNode -> {
                        String imageUrl = normalizeAssetUrl(imageNode.path("image_url").asText(""));
                        if (imageUrl.isBlank() || color.getImages().stream().anyMatch(existing -> imageUrl.equals(existing.getImageUrl()))) {
                            return;
                        }

                        ProductImage image = ProductImage.builder()
                                .productColor(color)
                                .imageUrl(imageUrl)
                                .sortOrder(imageNode.path("position").asInt(color.getImages().size()))
                                .isMain(color.getImages().isEmpty())
                                .build();
                        image.setIsDeleted(false);
                        color.getImages().add(image);
                    });
                }
            }
        }

        return new ArrayList<>(colorMap.values());
    }

    private String extractInlineScript(String html) {
        Matcher matcher = Pattern.compile("<script>(.*?)</script>", Pattern.DOTALL).matcher(html);
        while (matcher.find()) {
            String content = matcher.group(1);
            if (content.contains("self.PDPData")) {
                return content;
            }
        }
        throw new IllegalStateException("Unable to locate Yody inline product payload");
    }

    private String getBody(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "Mozilla/5.0 (compatible; BagyImporter/1.0)")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalStateException("Request failed with status " + response.statusCode());
            }
            return response.body();
        } catch (IOException | InterruptedException exception) {
            throw new IllegalStateException("Failed to fetch " + url, exception);
        }
    }

    private String extractSlug(String productUrl, String payloadSlug) {
        if (payloadSlug != null && !payloadSlug.isBlank()) {
            return payloadSlug.trim();
        }

        int index = productUrl.lastIndexOf('/');
        return index >= 0 ? productUrl.substring(index + 1).trim() : productUrl.trim();
    }

    private String cleanDescription(String html) {
        String withoutTags = TAG_PATTERN.matcher(HtmlUtils.htmlUnescape(html)).replaceAll(" ");
        return WHITESPACE_PATTERN.matcher(withoutTags).replaceAll(" ").trim();
    }

    private String buildShortDescription(String seoDescription, String description) {
        String cleanedSeo = cleanText(seoDescription);
        if (!cleanedSeo.isBlank()) {
            return truncate(cleanedSeo, 240);
        }
        return truncate(description, 240);
    }

    private String buildMaterialText(JsonNode materialNode, String description) {
        if (materialNode == null || materialNode.isMissingNode()) {
            return inferMaterialFromDescription(description);
        }

        LinkedHashSet<String> materialParts = new LinkedHashSet<>();
        addMaterialPart(materialParts, materialNode.path("name").asText(""));
        addMaterialPart(materialParts, materialNode.path("component").asText(""));
        addMaterialPart(materialParts, materialNode.path("description").asText(""));
        addMaterialPart(materialParts, materialNode.path("preserve").asText(""));

        JsonNode specificationsNode = materialNode.path("specifications");
        if (specificationsNode.isArray()) {
            specificationsNode.forEach(item -> addMaterialPart(materialParts, item.asText("")));
        } else if (specificationsNode.isTextual()) {
            addMaterialPart(materialParts, specificationsNode.asText(""));
        }

        if (materialParts.isEmpty()) {
            String inferredMaterial = inferMaterialFromDescription(description);
            if (!inferredMaterial.isBlank()) {
                materialParts.add(inferredMaterial);
            }
        }

        return String.join(" | ", materialParts);
    }

    private void addMaterialPart(LinkedHashSet<String> materialParts, String rawValue) {
        String cleanedValue = cleanText(rawValue);
        if (!cleanedValue.isBlank()) {
            materialParts.add(cleanedValue);
        }
    }

    private String inferMaterialFromDescription(String description) {
        String cleanedDescription = cleanText(description);
        if (cleanedDescription.isBlank()) {
            return "";
        }

        for (String keyword : List.of("cotton", "poly", "spandex", "modal", "len", "lụa", "linen", "denim", "jean", "thun")) {
            int index = cleanedDescription.toLowerCase(Locale.ROOT).indexOf(keyword);
            if (index >= 0) {
                return truncate(cleanedDescription.substring(index), 180);
            }
        }

        return "";
    }

    private String cleanText(String value) {
        if (value == null) {
            return "";
        }
        return WHITESPACE_PATTERN.matcher(HtmlUtils.htmlUnescape(value)).replaceAll(" ").trim();
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value == null ? "" : value;
        }
        return value.substring(0, maxLength).trim();
    }

    private String normalizeAssetUrl(String value) {
        String cleaned = cleanText(value);
        if (cleaned.isBlank()) {
            return "";
        }
        if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
            return cleaned;
        }
        if (cleaned.startsWith("//")) {
            return "https:" + cleaned;
        }
        return YODY_IMAGE_BASE + cleaned.replaceFirst("^/+", "");
    }

    private String normalizeHex(String value) {
        String cleaned = cleanText(value);
        if (cleaned.isBlank()) {
            return "#111111";
        }
        return cleaned.startsWith("#") ? cleaned.toUpperCase(Locale.ROOT) : "#" + cleaned.toUpperCase(Locale.ROOT);
    }

    private BigDecimal normalizePrice(String value) {
        String cleaned = cleanText(value).replaceAll("[^0-9]", "");
        if (cleaned.isBlank()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(cleaned);
    }

    private String deriveGender(String categorySlug, String productName) {
        String haystack = (categorySlug + " " + productName).toLowerCase(Locale.ROOT);
        if (haystack.contains("nam") || haystack.contains("be-trai")) {
            return "MALE";
        }
        if (haystack.contains("nữ") || haystack.contains("nu") || haystack.contains("gai")) {
            return "FEMALE";
        }
        return "UNISEX";
    }

    private String deriveStyle(String productName, String categorySlug) {
        String haystack = (productName + " " + categorySlug).toLowerCase(Locale.ROOT);
        if (haystack.contains("slim")) {
            return "SLIM_FIT";
        }
        if (haystack.contains("oversize") || haystack.contains("boxy") || haystack.contains("form rộng")) {
            return "OVERSIZE";
        }
        if (haystack.contains("sport") || haystack.contains("the-thao") || haystack.contains("thể thao")) {
            return "SPORT";
        }
        if (haystack.contains("regular")) {
            return "REGULAR";
        }
        return "CASUAL";
    }

    private enum ImportAction {
        CREATED,
        UPDATED,
        SKIPPED
    }

    public record YodyImportResult(
            int totalRequested,
            int createdCount,
            int updatedCount,
            int skippedCount,
            int failedCount) {
    }

    private record YodyCategoryNode(
            Integer id,
            String name,
            String iconUrl,
            Boolean status,
            Integer parentId,
            String slug,
            Integer position,
            Integer level,
            String seoTitle,
            List<YodyCategoryNode> children,
            String parentSlug) {
        private YodyCategoryNode withParent(String resolvedParentSlug) {
            return new YodyCategoryNode(
                    id,
                    name,
                    iconUrl,
                    status,
                    parentId,
                    slug,
                    position == null ? 0 : position,
                    level == null ? 0 : level,
                    seoTitle,
                    children,
                    resolvedParentSlug);
        }
    }
}
