package com.project.ecommerce.modules.product.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.product.dto.request.CreateCategoryRequest;
import com.project.ecommerce.modules.product.dto.request.UpdateCategoryRequest;
import com.project.ecommerce.modules.product.dto.response.CategoryResponse;
import com.project.ecommerce.modules.product.entity.Category;
import com.project.ecommerce.modules.product.mapper.CategoryMapper;
import com.project.ecommerce.modules.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAll(Specification<Category> spec) {
        return categoryRepository.findAll(spec).stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> getPage(Specification<Category> spec, Pageable pageable) {
        Page<Category> categoryPage = categoryRepository.findAll(spec, pageable);
        return PageResponse.<CategoryResponse>builder()
                .currentPage(categoryPage.getNumber())
                .pageSize(categoryPage.getSize())
                .totalPages(categoryPage.getTotalPages())
                .totalElements(categoryPage.getTotalElements())
                .last(categoryPage.isLast())
                .data(categoryPage.getContent().stream().map(categoryMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(String id) {
        return categoryMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    @PreAuthorize("hasAuthority('CATEGORY:CREATE')")
    public CategoryResponse create(CreateCategoryRequest req) {
        if (categoryRepository.existsBySlug(req.getSlug()))
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);

        Category category = categoryMapper.toEntity(req);
        applyParent(category, req.getParentId());

        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Transactional
    @PreAuthorize("hasAuthority('CATEGORY:UPDATE')")
    public CategoryResponse update(String id, UpdateCategoryRequest req) {
        Category category = findOrThrow(id);
        categoryMapper.updateCategory(category, req);
        applyParent(category, req.getParentId());
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Transactional
    @PreAuthorize("hasAuthority('CATEGORY:DELETE')")
    public void delete(String id) {
        Category category = findOrThrow(id);
        category.setIsDeleted(true);
        categoryRepository.save(category);
    }

    // ──────────────── HELPERS ────────────────

    private Category findOrThrow(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
    }

    private void applyParent(Category category, String parentId) {
        if (parentId != null && !parentId.isBlank())
            category.setParent(findOrThrow(parentId));
        else
            category.setParent(null);
    }
}
