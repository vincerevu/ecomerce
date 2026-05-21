package com.project.ecommerce.modules.order.repository;

import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.projection.OrderItemCountView;
import com.project.ecommerce.modules.order.projection.OrderUserView;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, String>, JpaSpecificationExecutor<Order> {
    Optional<Order> findByOrderCode(String orderCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select o
            from Order o
            where o.id = :id
            """)
    Optional<Order> findByIdForUpdate(@Param("id") String id);

    @Query("""
            select distinct o
            from Order o
            left join fetch o.user
            left join fetch o.items i
            left join fetch i.product
            left join fetch i.productVariant
            where o.id = :id
            """)
    Optional<Order> findDetailById(@Param("id") String id);

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

    @Query("""
            select o.id as id,
                   u.id as userId
            from Order o
            left join o.user u
            where o.id in :ids
            """)
    List<OrderUserView> findUserIdsByOrderIds(@Param("ids") List<String> ids);

    @Query("""
            select i.order.id as orderId,
                   count(i.id) as itemCount
            from OrderItem i
            where i.order.id in :ids
            group by i.order.id
            """)
    List<OrderItemCountView> countItemsByOrderIds(@Param("ids") List<String> ids);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime createdAt);

    @Query("""
            select count(i.id) > 0
            from OrderItem i
            where i.order.id = :orderId
              and i.order.user.id = :userId
              and i.order.status = com.project.ecommerce.modules.order.enums.OrderStatus.DELIVERED
              and i.product.id = :productId
            """)
    boolean existsDeliveredProductForUser(
            @Param("userId") String userId,
            @Param("orderId") String orderId,
            @Param("productId") String productId);
}
