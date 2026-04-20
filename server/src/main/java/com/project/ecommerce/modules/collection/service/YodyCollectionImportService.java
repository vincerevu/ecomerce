package com.project.ecommerce.modules.collection.service;

import com.project.ecommerce.modules.collection.entity.ProductCollection;
import com.project.ecommerce.modules.collection.repository.ProductCollectionRepository;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class YodyCollectionImportService {
    private static final String HOME_URL = "https://yody.vn";
    private static final Pattern COLLECTION_URL_PATTERN = Pattern.compile(
            "(?:https://yody\\.vn)?(/collection/[a-zA-Z0-9\\-_%]+(?:\\?[^\"'\\s<>]+)?)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern TITLE_PATTERN = Pattern.compile("<title>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern DESCRIPTION_PATTERN = Pattern.compile(
            "<meta\\s+name=\"description\"\\s+content=\"(.*?)\">",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern OG_TITLE_PATTERN = Pattern.compile(
            "<meta\\s+property=\"og:title\"\\s+content=\"(.*?)\">",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern OG_IMAGE_PATTERN = Pattern.compile(
            "<meta\\s+property=\"og:image\"\\s+content=\"(.*?)\">",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern CANONICAL_PATTERN = Pattern.compile(
            "<link\\s+rel=\"canonical\"\\s+href=\"(.*?)\">",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern PRODUCT_URL_PATTERN = Pattern.compile(
            "/product/([a-zA-Z0-9\\-_%]+)(?:\\?[^\"'\\s<>]*)?",
            Pattern.CASE_INSENSITIVE);

    private final ProductCollectionRepository productCollectionRepository;
    private final ProductRepository productRepository;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public YodyCollectionImportResult importCollections(Integer limit) {
        List<CollectionSeed> seeds = fetchCollectionSeeds(limit);
        AtomicInteger created = new AtomicInteger();
        AtomicInteger updated = new AtomicInteger();
        AtomicInteger failed = new AtomicInteger();

        for (CollectionSeed seed : seeds) {
            try {
                boolean existed = productCollectionRepository.findBySlug(seed.slug()).isPresent();
                importCollection(seed);
                if (existed) {
                    updated.incrementAndGet();
                } else {
                    created.incrementAndGet();
                }
            } catch (Exception exception) {
                failed.incrementAndGet();
                log.warn("Failed to import Yody collection {}: {}", seed.url(), exception.getMessage());
            }
        }

        return new YodyCollectionImportResult(seeds.size(), created.get(), updated.get(), failed.get());
    }

    private List<CollectionSeed> fetchCollectionSeeds(Integer limit) {
        String html = getBody(HOME_URL);
        Matcher matcher = COLLECTION_URL_PATTERN.matcher(html);
        Map<String, CollectionSeed> uniqueCollections = new LinkedHashMap<>();
        int index = 1;

        while (matcher.find()) {
            String rawUrl = matcher.group(1);
            String normalizedUrl = normalizeCollectionUrl(rawUrl);
            String slug = extractSlugFromCollectionUrl(normalizedUrl);
            if (slug.isBlank() || uniqueCollections.containsKey(slug)) {
                continue;
            }

            uniqueCollections.put(slug, new CollectionSeed(slug, normalizedUrl, index++));
            if (limit != null && limit > 0 && uniqueCollections.size() >= limit) {
                break;
            }
        }

        return new ArrayList<>(uniqueCollections.values());
    }

    private void importCollection(CollectionSeed seed) {
        String html = getBody(seed.url());
        String seoTitle = firstMatch(html, OG_TITLE_PATTERN);
        if (seoTitle.isBlank()) {
            seoTitle = stripSiteSuffix(firstMatch(html, TITLE_PATTERN));
        }
        String seoDescription = firstMatch(html, DESCRIPTION_PATTERN);
        String canonicalUrl = normalizeCollectionUrl(firstMatch(html, CANONICAL_PATTERN));
        if (canonicalUrl.isBlank()) {
            canonicalUrl = seed.url();
        }
        String coverMediaUrl = firstMatch(html, OG_IMAGE_PATTERN);

        Set<String> productSlugs = extractProductSlugs(html);
        List<Product> linkedProducts = productSlugs.isEmpty()
                ? List.of()
                : productRepository.findBySlugIn(productSlugs);

        ProductCollection collection = productCollectionRepository.findBySlug(seed.slug())
                .orElseGet(ProductCollection::new);
        collection.setName(seoTitle.isBlank() ? seed.slug() : seoTitle);
        collection.setSlug(seed.slug());
        collection.setSeoTitle(seoTitle);
        collection.setSeoDescription(seoDescription);
        collection.setCanonicalUrl(canonicalUrl);
        collection.setSourceUrl(seed.url());
        collection.setCoverMediaUrl(coverMediaUrl);
        collection.setCoverMediaType(detectMediaType(coverMediaUrl));
        collection.setProductCount(productSlugs.size());
        collection.setSortOrder(seed.sortOrder());
        collection.setStatus(true);
        collection.getProducts().clear();
        collection.getProducts().addAll(linkedProducts);
        productCollectionRepository.save(collection);
    }

    private Set<String> extractProductSlugs(String html) {
        Matcher matcher = PRODUCT_URL_PATTERN.matcher(html);
        Set<String> slugs = new LinkedHashSet<>();
        while (matcher.find()) {
            String slug = matcher.group(1);
            if (slug != null && !slug.isBlank()) {
                slugs.add(slug.toLowerCase(Locale.ROOT));
            }
        }
        return slugs;
    }

    private String normalizeCollectionUrl(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String htmlDecoded = HtmlUtils.htmlUnescape(value.trim());
        String absoluteUrl = htmlDecoded.startsWith("http") ? htmlDecoded : HOME_URL + htmlDecoded;
        try {
            URI uri = URI.create(absoluteUrl);
            return uri.getScheme() + "://" + uri.getHost() + uri.getPath();
        } catch (Exception exception) {
            return absoluteUrl;
        }
    }

    private String extractSlugFromCollectionUrl(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        String normalized = normalizeCollectionUrl(url);
        int index = normalized.lastIndexOf("/collection/");
        if (index < 0) {
            return "";
        }
        return normalized.substring(index + "/collection/".length()).trim().toLowerCase(Locale.ROOT);
    }

    private String firstMatch(String html, Pattern pattern) {
        Matcher matcher = pattern.matcher(html);
        if (!matcher.find()) {
            return "";
        }
        return cleanText(matcher.group(1));
    }

    private String stripSiteSuffix(String title) {
        if (title == null) {
            return "";
        }
        return title.replaceAll("\\s*\\|\\s*Yody\\s*$", "").trim();
    }

    private String cleanText(String value) {
        if (value == null) {
            return "";
        }
        return HtmlUtils.htmlUnescape(value)
                .replaceAll("<[^>]+>", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String detectMediaType(String url) {
        String normalized = Optional.ofNullable(url).orElse("").toLowerCase(Locale.ROOT);
        if (normalized.endsWith(".mp4") || normalized.contains("/videos/")) {
            return "VIDEO";
        }
        return "IMAGE";
    }

    private String getBody(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .GET()
                    .timeout(Duration.ofSeconds(30))
                    .header("User-Agent", "Mozilla/5.0 (compatible; BagyCollectionImporter/1.0)")
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalStateException("Request failed with status " + response.statusCode());
            }
            return response.body();
        } catch (IOException | InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Unable to fetch Yody URL: " + url, exception);
        }
    }

    public record YodyCollectionImportResult(
            int totalCollections,
            int createdCount,
            int updatedCount,
            int failedCount) {
    }

    private record CollectionSeed(String slug, String url, int sortOrder) {
    }
}
