package com.project.ecommerce.modules.shipping.repository;

import com.project.ecommerce.modules.shipping.entity.ShipmentEvent;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, String> {
    List<ShipmentEvent> findAllByShipmentIdOrderByEventTimeDesc(String shipmentId);

    @Query("""
            select e
            from ShipmentEvent e
            join fetch e.shipment s
            where s.id in :shipmentIds
            order by e.eventTime desc
            """)
    List<ShipmentEvent> findAllByShipmentIdInOrderByEventTimeDesc(@Param("shipmentIds") Collection<String> shipmentIds);
}
