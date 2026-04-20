package com.project.ecommerce.modules.product.repository;

import com.project.ecommerce.modules.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, String> {
    List<ProductImage> findByProductColorIdInOrderBySortOrderAsc(Collection<String> productColorIds);

    void deleteByProductColorProductId(String productId);
}
