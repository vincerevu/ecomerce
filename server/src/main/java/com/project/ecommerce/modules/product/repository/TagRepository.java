package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, String>, JpaSpecificationExecutor<Tag> {
    Optional<Tag> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
