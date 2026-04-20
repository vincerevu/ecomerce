package com.project.ecommerce.modules.payment.repository;

import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String>,
        JpaSpecificationExecutor<PaymentTransaction> {
    boolean existsByTransactionCode(String transactionCode);

    Optional<PaymentTransaction> findByTransactionCode(String transactionCode);

    Optional<PaymentTransaction> findFirstByProviderAndProviderReferenceOrderByCreatedAtDesc(
            PaymentProvider provider,
            String providerReference);

    Optional<PaymentTransaction> findFirstByProviderAndOrder_OrderCodeOrderByCreatedAtDesc(
            PaymentProvider provider,
            String orderCode);

    List<PaymentTransaction> findByOrder(Order order);

    long countBy();
    long countByStatus(PaymentStatus status);

    @Query("""
            select p.provider as provider, count(p) as count, coalesce(sum(p.amount), 0) as amount
            from PaymentTransaction p
            group by p.provider
            """)
    List<PaymentProviderSummary> summarizeByProvider();

    interface PaymentProviderSummary {
        PaymentProvider getProvider();
        long getCount();
        BigDecimal getAmount();
    }
}
