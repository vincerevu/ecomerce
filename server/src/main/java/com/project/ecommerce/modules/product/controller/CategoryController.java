package com.project.ecommerce.modules.product.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.product.dto.request.CreateCategoryRequest;
import com.project.ecommerce.modules.product.dto.request.UpdateCategoryRequest;
import com.project.ecommerce.modules.product.dto.response.CategoryResponse;
import com.project.ecommerce.modules.product.entity.Category;
import com.project.ecommerce.modules.product.service.CategoryService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category Controller")
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "Get all categories")
    @GetMapping
    public ApiResponse<List<CategoryResponse>> getAll(@Filter Specification<Category> spec) {
        return ApiResponse.<List<CategoryResponse>>builder()
                .code(1000).message("Success")
                .result(categoryService.getAll(spec))
                .build();
    }

    @Operation(summary = "Get paginated categories")
    @GetMapping("/page")
    public ApiResponse<PageResponse<CategoryResponse>> getPage(
            Pageable pageable,
            @Filter Specification<Category> spec) {
        return ApiResponse.<PageResponse<CategoryResponse>>builder()
                .code(1000).message("Success")
                .result(categoryService.getPage(spec, pageable))
                .build();
    }

    @Operation(summary = "Get category by ID")
    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getById(@PathVariable String id) {
        return ApiResponse.<CategoryResponse>builder()
                .code(1000).message("Success")
                .result(categoryService.getById(id))
                .build();
    }

    @Operation(summary = "Create category")
    @PostMapping
    public ApiResponse<CategoryResponse> create(@Valid @RequestBody CreateCategoryRequest req) {
        return ApiResponse.<CategoryResponse>builder()
                .code(1000).message("Category created")
                .result(categoryService.create(req))
                .build();
    }

    @Operation(summary = "Update category")
    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> update(@PathVariable String id,
            @Valid @RequestBody UpdateCategoryRequest req) {
        return ApiResponse.<CategoryResponse>builder()
                .code(1000).message("Category updated")
                .result(categoryService.update(id, req))
                .build();
    }

    @Operation(summary = "Delete category")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        categoryService.delete(id);
        return ApiResponse.<Void>builder().code(1000).message("Category deleted").build();
    }
}
