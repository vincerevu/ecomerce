package com.project.ecommerce.modules.checkout.repository;

import com.project.ecommerce.modules.checkout.entity.CartItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, String> {
    List<CartItem> findByCartIdOrderByCreatedAtAsc(String cartId);

    void deleteByCartId(String cartId);

    void deleteByIdIn(Collection<String> ids);
}
