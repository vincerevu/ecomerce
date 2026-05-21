package com.project.ecommerce.modules.order.repository;

import com.project.ecommerce.modules.order.entity.Cart;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CartRepository extends JpaRepository<Cart, String> {
    Optional<Cart> findByUserId(String userId);

    @Query("""
            select distinct c
            from Cart c
            join fetch c.user
            left join fetch c.items i
            left join fetch i.product
            left join fetch i.productVariant
            where c.user.id = :userId
            """)
    Optional<Cart> findByUserIdWithItems(@Param("userId") String userId);
}
