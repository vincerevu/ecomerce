package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.Collection;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

  Optional<Product> findBySlug(String slug);

  List<Product> findByIdIn(Collection<String> ids);

  Optional<Product> findOneById(String id);

  Optional<Product> findOneBySlug(String slug);

  List<Product> findBySlugIn(Collection<String> slugs);

  boolean existsBySlug(String slug);

  boolean existsBySlugAndIdNot(String slug, String id);

  List<Product> findBySlugIsNotNull();

  long countByStatus(String status);
}
