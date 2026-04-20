package com.project.ecommerce.modules.product.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.product.dto.request.CreateProductRequest;
import com.project.ecommerce.modules.product.dto.response.ProductResponse;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.service.ProductService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Product Controller", description = "APIs for querying and managing products")
public class ProductController {

    private final ProductService productService;

    @Operation(summary = "Get all products with dynamic filter + pagination")
    @GetMapping
    public ApiResponse<PageResponse<ProductResponse>> getProducts(
            Pageable pageable,
            @Filter Specification<Product> spec) {
        return ApiResponse.<PageResponse<ProductResponse>>builder()
                .code(1000).message("Success")
                .result(productService.getProducts(pageable, spec))
                .build();
    }

    @Operation(summary = "Get product detail by ID")
    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProductById(@PathVariable String id) {
        return ApiResponse.<ProductResponse>builder()
                .code(1000).message("Success")
                .result(productService.getProductById(id))
                .build();
    }

    @Operation(summary = "Get product detail by slug")
    @GetMapping("/slug/{slug}")
    public ApiResponse<ProductResponse> getProductBySlug(@PathVariable String slug) {
        return ApiResponse.<ProductResponse>builder()
                .code(1000).message("Success")
                .result(productService.getProductBySlug(slug))
                .build();
    }

    @Operation(summary = "Create new product")
    @PostMapping
    public ApiResponse<ProductResponse> create(@Valid @RequestBody CreateProductRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .code(1000).message("Product created")
                .result(productService.create(request))
                .build();
    }

    @Operation(summary = "Update product")
    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> update(@PathVariable String id,
            @Valid @RequestBody CreateProductRequest req) {
        return ApiResponse.<ProductResponse>builder()
                .code(1000).message("Product updated")
                .result(productService.update(id, req))
                .build();
    }

    @Operation(summary = "Update product status")
    @PatchMapping("/{id}/status")
    public ApiResponse<ProductResponse> updateStatus(@PathVariable String id,
            @RequestParam String status) {
        return ApiResponse.<ProductResponse>builder()
                .code(1000).message("Status updated")
                .result(productService.updateStatus(id, status))
                .build();
    }

    @Operation(summary = "Soft delete product")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        productService.delete(id);
        return ApiResponse.<Void>builder().code(1000).message("Product deleted").build();
    }
}
