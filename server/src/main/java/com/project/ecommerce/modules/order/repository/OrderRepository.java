package com.project.ecommerce.modules.order.repository;

import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, String>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByOrderCode(String orderCode);
    boolean existsByOrderCode(String orderCode);
    long countByStatus(OrderStatus status);
    long countByStatusIn(List<OrderStatus> statuses);
    List<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Order> findByStatusAndCreatedAtGreaterThanEqual(OrderStatus status, LocalDateTime createdAt, Pageable pageable);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o where o.status = :status")
    BigDecimal sumTotalAmountByStatus(OrderStatus status);

    @Query("""
            select coalesce(sum(o.totalAmount), 0)
            from Order o
            where o.user.id = :userId
              and o.status = :status
            """)
    BigDecimal sumTotalAmountByUserIdAndStatus(@Param("userId") String userId, @Param("status") OrderStatus status);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime createdAt);
}
