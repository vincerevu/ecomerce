package com.project.ecommerce.modules.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.ecommerce.modules.product.entity.Category;
import com.project.ecommerce.modules.product.mapper.CategoryMapper;
import com.project.ecommerce.modules.product.repository.CategoryRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void delete_shouldSoftDeleteCategory() {
        Category category = Category.builder()
                .id("category-1")
                .name("Category")
                .slug("category")
                .isDeleted(false)
                .build();
        when(categoryRepository.findById("category-1")).thenReturn(Optional.of(category));

        categoryService.delete("category-1");

        assertThat(category.getIsDeleted()).isTrue();
        verify(categoryRepository).save(category);
    }
}
