package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String>, JpaSpecificationExecutor<Category> {
    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByParentId(String parentId);

    long countByParentIsNull();
}
