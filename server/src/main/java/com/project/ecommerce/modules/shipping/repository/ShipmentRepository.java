package com.project.ecommerce.modules.shipping.repository;

import com.project.ecommerce.modules.shipping.entity.Shipment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShipmentRepository extends JpaRepository<Shipment, String>, JpaSpecificationExecutor<Shipment> {
    boolean existsByOrderId(String orderId);
    boolean existsByClientOrderCode(String clientOrderCode);
    Optional<Shipment> findByOrderId(String orderId);

    @Query("""
            select distinct s
            from Shipment s
            join fetch s.order
            where s.order.id = :orderId
            """)
    Optional<Shipment> findByOrderIdWithOrder(@Param("orderId") String orderId);

    Optional<Shipment> findByClientOrderCode(String clientOrderCode);
    Optional<Shipment> findByTrackingCode(String trackingCode);

    @Query("""
            select distinct s
            from Shipment s
            join fetch s.order
            where s.id in :ids
            """)
    List<Shipment> findDetailsByIds(@Param("ids") Collection<String> ids);

    @Query("""
            select distinct s
            from Shipment s
            join fetch s.order
            where s.id = :id
            """)
    Optional<Shipment> findDetailById(@Param("id") String id);
}
