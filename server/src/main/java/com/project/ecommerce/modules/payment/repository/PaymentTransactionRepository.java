package com.project.ecommerce.modules.payment.repository;

import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.projection.PaymentProviderSummary;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String>,
        JpaSpecificationExecutor<PaymentTransaction> {
    boolean existsByTransactionCode(String transactionCode);

    Optional<PaymentTransaction> findByTransactionCode(String transactionCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from PaymentTransaction p
            where p.id = :id
            """)
    Optional<PaymentTransaction> findByIdForUpdate(@Param("id") String id);

    @Query("""
            select distinct p
            from PaymentTransaction p
            left join fetch p.order
            where p.id in :ids
            """)
    List<PaymentTransaction> findDetailsByIds(@Param("ids") Collection<String> ids);

    @Query("""
            select distinct p
            from PaymentTransaction p
            left join fetch p.order
            where p.id = :id
            """)
    Optional<PaymentTransaction> findDetailById(@Param("id") String id);

    Optional<PaymentTransaction> findFirstByProviderAndProviderReferenceOrderByCreatedAtDesc(
            PaymentProvider provider,
            String providerReference);

    Optional<PaymentTransaction> findFirstByProviderAndOrder_OrderCodeOrderByCreatedAtDesc(
            PaymentProvider provider,
            String orderCode);

    List<PaymentTransaction> findByOrder(Order order);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from PaymentTransaction p
            where p.order = :order
            """)
    List<PaymentTransaction> findByOrderForUpdate(@Param("order") Order order);

    long countBy();
    long countByStatus(PaymentStatus status);

    @Query("""
            select p.provider as provider, count(p) as count, coalesce(sum(p.amount), 0) as amount
            from PaymentTransaction p
            group by p.provider
            """)
    List<PaymentProviderSummary> summarizeByProvider();
}
