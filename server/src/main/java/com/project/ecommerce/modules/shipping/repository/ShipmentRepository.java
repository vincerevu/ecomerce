package com.project.ecommerce.modules.shipping.repository;

import com.project.ecommerce.modules.shipping.entity.Shipment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ShipmentRepository extends JpaRepository<Shipment, String>, JpaSpecificationExecutor<Shipment> {
    boolean existsByOrderId(String orderId);
    boolean existsByClientOrderCode(String clientOrderCode);
    Optional<Shipment> findByOrderId(String orderId);
    Optional<Shipment> findByClientOrderCode(String clientOrderCode);
    Optional<Shipment> findByTrackingCode(String trackingCode);
}
