package com.project.ecommerce.modules.shipping.repository;

import com.project.ecommerce.modules.shipping.entity.ShipmentEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, String> {
    List<ShipmentEvent> findAllByShipmentIdOrderByEventTimeDesc(String shipmentId);
}
