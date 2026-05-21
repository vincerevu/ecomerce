package com.project.ecommerce.modules.review.repository;

import com.project.ecommerce.modules.review.entity.ProductReview;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, String>, JpaSpecificationExecutor<ProductReview> {
    boolean existsByUserIdAndOrderIdAndProductId(String userId, String orderId, String productId);

    Optional<ProductReview> findByUserIdAndOrderIdAndProductId(String userId, String orderId, String productId);

    List<ProductReview> findByUserIdAndOrderId(String userId, String orderId);

    @Query("""
            select coalesce(avg(r.rating), 0)
            from ProductReview r
            where r.product.id = :productId
              and r.approved = true
            """)
    Double averageRatingByProductId(@Param("productId") String productId);

    long countByProductIdAndApprovedTrue(String productId);
}
