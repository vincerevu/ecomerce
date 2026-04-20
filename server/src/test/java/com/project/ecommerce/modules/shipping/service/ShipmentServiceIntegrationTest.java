package com.project.ecommerce.modules.shipping.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.shipping.client.GhnClient;
import com.project.ecommerce.modules.shipping.dto.request.CreateShipmentRequest;
import com.project.ecommerce.modules.shipping.entity.Shipment;
import com.project.ecommerce.modules.shipping.enums.RequiredNoteType;
import com.project.ecommerce.modules.shipping.enums.ShipmentStatus;
import com.project.ecommerce.modules.shipping.repository.ShipmentEventRepository;
import com.project.ecommerce.modules.shipping.repository.ShipmentRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class ShipmentServiceIntegrationTest {

    @Autowired
    private ShipmentService shipmentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private ShipmentEventRepository shipmentEventRepository;

    @MockBean
    private GhnClient ghnClient;

    @Test
    @Transactional
    @WithMockUser(authorities = { "SHIPMENT:CREATE", "SHIPMENT:VIEW", "SHIPMENT:UPDATE" })
    void createShipment_shouldPersistShipmentAndCreateInitialEvent() {
        Order order = createOrder();
        when(ghnClient.createOrder(any())).thenReturn(new GhnClient.GhnShipmentCreatedResult(
                "GHN123456",
                "ready_to_pick",
                LocalDateTime.now().plusDays(2),
                BigDecimal.valueOf(32000),
                "{\"order_code\":\"GHN123456\"}"));

        CreateShipmentRequest request = new CreateShipmentRequest();
        request.setOrderId(order.getId());
        request.setServiceId(53320);
        request.setPaymentTypeId(1);
        request.setRequiredNote(RequiredNoteType.CHOTHUHANG);
        request.setWeight(1200);
        request.setLength(25);
        request.setWidth(20);
        request.setHeight(10);
        request.setToName(order.getCustomerName());
        request.setToPhone(order.getCustomerPhone());
        request.setToAddress("123 Nguyen Trai");
        request.setToProvinceName("Ho Chi Minh");
        request.setToDistrictName("Quan 10");
        request.setToWardName("Phuong 14");
        request.setToDistrictId(1442);
        request.setToWardCode("20308");
        request.setCodAmount(BigDecimal.valueOf(450000));
        request.setInsuranceValue(BigDecimal.valueOf(450000));
        request.setSenderName("BAGY Sandbox");
        request.setSenderPhone("0900000001");
        request.setSenderAddress("72 Thanh Thai");
        request.setSenderProvinceName("Ho Chi Minh");
        request.setSenderDistrictName("Quan 10");
        request.setSenderWardName("Phuong 14");

        var response = shipmentService.createShipment(request);

        Shipment shipment = shipmentRepository.findById(response.getId()).orElseThrow();

        assertThat(response.getTrackingCode()).isEqualTo("GHN123456");
        assertThat(response.getStatus()).isEqualTo(ShipmentStatus.READY_TO_PICK);
        assertThat(shipment.getShippingFee()).isEqualByComparingTo("32000");
        assertThat(shipmentEventRepository.findAllByShipmentIdOrderByEventTimeDesc(shipment.getId())).hasSize(1);
    }

    @Test
    @Transactional
    @WithMockUser(authorities = { "SHIPMENT:CREATE", "SHIPMENT:VIEW", "SHIPMENT:UPDATE" })
    void syncShipment_shouldUpdateShipmentAndOrderStatus() {
        Shipment shipment = createShipmentEntity();

        when(ghnClient.getOrderDetailByClientOrderCode(eq(shipment.getClientOrderCode())))
                .thenReturn(new GhnClient.GhnShipmentTrackingResult(
                        shipment.getTrackingCode(),
                        "delivered",
                        LocalDateTime.now().plusDays(1),
                        "Da giao thanh cong",
                        "{\"status\":\"delivered\"}"));

        var response = shipmentService.syncShipment(shipment.getId());

        Order refreshedOrder = orderRepository.findById(shipment.getOrder().getId()).orElseThrow();
        assertThat(response.getStatus()).isEqualTo(ShipmentStatus.DELIVERED);
        assertThat(refreshedOrder.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(shipmentEventRepository.findAllByShipmentIdOrderByEventTimeDesc(shipment.getId())).hasSize(1);
    }

    @Test
    @Transactional
    @WithMockUser(authorities = { "SHIPMENT:UPDATE", "SHIPMENT:VIEW" })
    void cancelShipment_shouldMarkShipmentAndOrderAsCancelled() {
        Shipment shipment = createShipmentEntity();
        doNothing().when(ghnClient).cancelOrder(eq(shipment.getTrackingCode()));

        var response = shipmentService.cancelShipment(shipment.getId());

        Order refreshedOrder = orderRepository.findById(shipment.getOrder().getId()).orElseThrow();
        assertThat(response.getStatus()).isEqualTo(ShipmentStatus.CANCELLED);
        assertThat(refreshedOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    @Transactional
    @WithMockUser(authorities = { "SHIPMENT:VIEW" })
    void getByOrderId_shouldReturnShipment() {
        Shipment shipment = createShipmentEntity();

        var response = shipmentService.getByOrderId(shipment.getOrder().getId());

        assertThat(response.getId()).isEqualTo(shipment.getId());
        assertThat(response.getOrderId()).isEqualTo(shipment.getOrder().getId());
    }

    @Test
    @Transactional
    void handleGhnStatusWebhook_shouldUpdateShipmentAndAppendEvent() {
        Shipment shipment = createShipmentEntity();
        Map<String, Object> payload = new HashMap<>();
        payload.put("client_order_code", shipment.getClientOrderCode());
        payload.put("order_code", shipment.getTrackingCode());
        payload.put("status", "delivered");
        payload.put("description", "Giao hàng thành công");
        payload.put("updated_at", "2026-03-19 08:30:45");

        shipmentService.handleGhnStatusWebhook(payload);

        Shipment refreshedShipment = shipmentRepository.findById(shipment.getId()).orElseThrow();
        Order refreshedOrder = orderRepository.findById(shipment.getOrder().getId()).orElseThrow();

        assertThat(refreshedShipment.getStatus()).isEqualTo(ShipmentStatus.DELIVERED);
        assertThat(refreshedOrder.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(shipmentEventRepository.findAllByShipmentIdOrderByEventTimeDesc(shipment.getId()))
                .hasSize(1)
                .first()
                .extracting("providerStatus")
                .isEqualTo("delivered");
    }

    private Order createOrder() {
        Order order = Order.builder()
                .orderCode("ORD-SHIP-" + UUID.randomUUID().toString().substring(0, 8))
                .customerName("Khach van chuyen")
                .customerPhone("0987000001")
                .customerEmail("ship@test.com")
                .shippingAddress("123 Nguyen Trai, Quan 10, Ho Chi Minh")
                .notes("Don test van chuyen")
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .subtotal(BigDecimal.valueOf(450000))
                .shippingFee(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(450000))
                .build();
        return orderRepository.save(order);
    }

    private Shipment createShipmentEntity() {
        Order order = createOrder();
        Shipment shipment = Shipment.builder()
                .order(order)
                .provider(com.project.ecommerce.modules.shipping.enums.ShippingProvider.GHN)
                .clientOrderCode("SHIP-" + order.getOrderCode())
                .trackingCode("GHN-" + UUID.randomUUID().toString().substring(0, 8))
                .status(ShipmentStatus.READY_TO_PICK)
                .shippingFee(BigDecimal.valueOf(25000))
                .codAmount(BigDecimal.valueOf(450000))
                .insuranceValue(BigDecimal.valueOf(450000))
                .weight(1000)
                .length(20)
                .width(15)
                .height(10)
                .toName(order.getCustomerName())
                .toPhone(order.getCustomerPhone())
                .toAddress("123 Nguyen Trai")
                .toProvinceName("Ho Chi Minh")
                .toDistrictName("Quan 10")
                .toWardName("Phuong 14")
                .toDistrictId(1442)
                .toWardCode("20308")
                .senderName("BAGY Sandbox")
                .senderPhone("0900000001")
                .senderAddress("72 Thanh Thai")
                .senderProvinceName("Ho Chi Minh")
                .senderDistrictName("Quan 10")
                .senderWardName("Phuong 14")
                .expectedDeliveryTime(LocalDateTime.now().plusDays(2))
                .providerPayload("{}")
                .build();
        return shipmentRepository.save(shipment);
    }
}
