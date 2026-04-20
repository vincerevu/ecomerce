package com.project.ecommerce.modules.collection.repository;

import com.project.ecommerce.modules.collection.entity.ProductCollection;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface ProductCollectionRepository extends JpaRepository<ProductCollection, String>, JpaSpecificationExecutor<ProductCollection> {
    Optional<ProductCollection> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);

    List<ProductCollection> findAllByOrderBySortOrderAscNameAsc();

    List<ProductCollection> findByStatusTrueOrderBySortOrderAscNameAsc(Pageable pageable);
}
