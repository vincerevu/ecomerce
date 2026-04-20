package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductColorRepository extends JpaRepository<ProductColor, String> {
    List<ProductColor> findByProductIdIn(Collection<String> productIds);

    void deleteByProductId(String productId);
}
