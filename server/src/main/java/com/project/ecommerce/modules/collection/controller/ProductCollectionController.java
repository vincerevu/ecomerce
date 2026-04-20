package com.project.ecommerce.modules.collection.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.collection.dto.request.CreateProductCollectionRequest;
import com.project.ecommerce.modules.collection.dto.request.UpdateProductCollectionRequest;
import com.project.ecommerce.modules.collection.dto.response.CollectionShowcaseResponse;
import com.project.ecommerce.modules.collection.dto.response.ProductCollectionResponse;
import com.project.ecommerce.modules.collection.entity.ProductCollection;
import com.project.ecommerce.modules.collection.service.ProductCollectionService;
import com.project.ecommerce.modules.product.dto.response.ProductResponse;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.jpa.domain.Specification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor
@Tag(name = "Collection Controller", description = "APIs for querying product collections")
public class ProductCollectionController {
    private final ProductCollectionService productCollectionService;

    @Operation(summary = "Get all collections")
    @GetMapping
    public ApiResponse<List<ProductCollectionResponse>> getCollections(@Filter Specification<ProductCollection> spec) {
        return ApiResponse.<List<ProductCollectionResponse>>builder()
                .code(1000)
                .message("Success")
                .result(productCollectionService.getCollections())
                .build();
    }

    @Operation(summary = "Get paginated collections")
    @GetMapping("/page")
    public ApiResponse<PageResponse<ProductCollectionResponse>> getPage(
            Pageable pageable,
            @Filter Specification<ProductCollection> spec) {
        return ApiResponse.<PageResponse<ProductCollectionResponse>>builder()
                .code(1000)
                .message("Success")
                .result(productCollectionService.getPage(spec, pageable))
                .build();
    }

    @Operation(summary = "Get collection by ID")
    @GetMapping("/{id}")
    public ApiResponse<ProductCollectionResponse> getById(@PathVariable String id) {
        return ApiResponse.<ProductCollectionResponse>builder()
                .code(1000)
                .message("Success")
                .result(productCollectionService.getById(id))
                .build();
    }

    @Operation(summary = "Get collection showcases for homepage")
    @GetMapping("/showcases")
    public ApiResponse<List<CollectionShowcaseResponse>> getCollectionShowcases(
            @RequestParam(defaultValue = "3") int limit,
            @RequestParam(defaultValue = "15") int productLimit) {
        return ApiResponse.<List<CollectionShowcaseResponse>>builder()
                .code(1000)
                .message("Success")
                .result(productCollectionService.getCollectionShowcases(limit, productLimit))
                .build();
    }

    @Operation(summary = "Get products by collection slug")
    @GetMapping("/{slug}/products")
    public ApiResponse<PageResponse<ProductResponse>> getCollectionProducts(
            @PathVariable String slug,
            Pageable pageable) {
        return ApiResponse.<PageResponse<ProductResponse>>builder()
                .code(1000)
                .message("Success")
                .result(productCollectionService.getCollectionProducts(slug, pageable))
                .build();
    }

    @Operation(summary = "Create collection")
    @PostMapping
    public ApiResponse<ProductCollectionResponse> create(@Valid @RequestBody CreateProductCollectionRequest request) {
        return ApiResponse.<ProductCollectionResponse>builder()
                .code(1000)
                .message("Collection created")
                .result(productCollectionService.create(request))
                .build();
    }

    @Operation(summary = "Update collection")
    @PutMapping("/{id}")
    public ApiResponse<ProductCollectionResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateProductCollectionRequest request) {
        return ApiResponse.<ProductCollectionResponse>builder()
                .code(1000)
                .message("Collection updated")
                .result(productCollectionService.update(id, request))
                .build();
    }

    @Operation(summary = "Delete collection")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        productCollectionService.delete(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Collection deleted")
                .build();
    }
}
