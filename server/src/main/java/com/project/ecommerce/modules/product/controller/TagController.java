package com.project.ecommerce.modules.product.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.product.dto.request.CreateTagRequest;
import com.project.ecommerce.modules.product.dto.response.TagResponse;
import com.project.ecommerce.modules.product.service.TagService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
@Tag(name = "Tag Controller")
public class TagController {

    private final TagService tagService;

    @Operation(summary = "Get all tags")
    @GetMapping
    public ApiResponse<List<TagResponse>> getAll(
            @Filter Specification<com.project.ecommerce.modules.product.entity.Tag> spec) {
        return ApiResponse.<List<TagResponse>>builder()
                .code(1000).message("Success")
                .result(tagService.getAll(spec))
                .build();
    }

    @Operation(summary = "Get tag by ID")
    @GetMapping("/{id}")
    public ApiResponse<TagResponse> getById(@PathVariable String id) {
        return ApiResponse.<TagResponse>builder()
                .code(1000).message("Success")
                .result(tagService.getById(id))
                .build();
    }

    @Operation(summary = "Create tag")
    @PostMapping
    public ApiResponse<TagResponse> create(@Valid @RequestBody CreateTagRequest req) {
        return ApiResponse.<TagResponse>builder()
                .code(1000).message("Tag created")
                .result(tagService.create(req))
                .build();
    }

    @Operation(summary = "Update tag")
    @PutMapping("/{id}")
    public ApiResponse<TagResponse> update(@PathVariable String id,
            @Valid @RequestBody CreateTagRequest req) {
        return ApiResponse.<TagResponse>builder()
                .code(1000).message("Tag updated")
                .result(tagService.update(id, req))
                .build();
    }

    @Operation(summary = "Delete tag")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        tagService.delete(id);
        return ApiResponse.<Void>builder().code(1000).message("Tag deleted").build();
    }
}
