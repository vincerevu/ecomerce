package com.project.ecommerce.modules.payment.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.project.ecommerce.modules.order.dto.request.CreateOrderRequest;
import com.project.ecommerce.modules.order.dto.request.OrderItemRequest;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.order.service.OrderService;
import com.project.ecommerce.modules.payment.dto.request.CreatePaymentTransactionRequest;
import com.project.ecommerce.modules.payment.dto.request.UpdatePaymentTransactionRequest;
import com.project.ecommerce.modules.payment.enums.PaymentMethod;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.enums.PaymentTransactionType;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class PaymentTransactionServiceIntegrationTest {

    @Autowired
    private PaymentTransactionService paymentTransactionService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    @WithMockUser(authorities = { "ORDER:CREATE", "PAYMENT:CREATE", "PAYMENT:VIEW", "PAYMENT:UPDATE" })
    void createPayment_shouldSyncOrderPaymentStatusToPaid() {
        Order order = createSimpleOrder();

        CreatePaymentTransactionRequest request = new CreatePaymentTransactionRequest();
        request.setOrderId(order.getId());
        request.setProvider(PaymentProvider.VNPAY);
        request.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        request.setTransactionType(PaymentTransactionType.CHARGE);
        request.setStatus(PaymentStatus.PAID);
        request.setAmount(order.getTotalAmount());
        request.setNotes("Khách đã thanh toán chuyển khoản");

        var response = paymentTransactionService.create(request);

        entityManager.flush();
        entityManager.clear();

        Order refreshedOrder = orderRepository.findById(order.getId()).orElseThrow();

        assertThat(response.getOrderId()).isEqualTo(order.getId());
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(response.getProcessedAt()).isNotNull();
        assertThat(refreshedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    @Test
    @Transactional
    @WithMockUser(authorities = { "ORDER:CREATE", "PAYMENT:CREATE", "PAYMENT:VIEW", "PAYMENT:UPDATE" })
    void refundPayment_shouldSyncOrderPaymentStatusToRefunded() {
        Order order = createSimpleOrder();

        CreatePaymentTransactionRequest chargeRequest = new CreatePaymentTransactionRequest();
        chargeRequest.setOrderId(order.getId());
        chargeRequest.setProvider(PaymentProvider.STRIPE);
        chargeRequest.setPaymentMethod(PaymentMethod.CARD);
        chargeRequest.setTransactionType(PaymentTransactionType.CHARGE);
        chargeRequest.setStatus(PaymentStatus.PAID);
        chargeRequest.setAmount(order.getTotalAmount());
        var charge = paymentTransactionService.create(chargeRequest);

        CreatePaymentTransactionRequest refundRequest = new CreatePaymentTransactionRequest();
        refundRequest.setOrderId(order.getId());
        refundRequest.setProvider(PaymentProvider.STRIPE);
        refundRequest.setPaymentMethod(PaymentMethod.CARD);
        refundRequest.setTransactionType(PaymentTransactionType.REFUND);
        refundRequest.setStatus(PaymentStatus.PENDING);
        refundRequest.setAmount(BigDecimal.valueOf(50000));
        var refund = paymentTransactionService.create(refundRequest);

        UpdatePaymentTransactionRequest updateRequest = new UpdatePaymentTransactionRequest();
        updateRequest.setStatus(PaymentStatus.REFUNDED);
        updateRequest.setNotes("Hoàn tiền một phần");
        paymentTransactionService.update(refund.getId(), updateRequest);

        entityManager.flush();
        entityManager.clear();

        Order refreshedOrder = orderRepository.findById(order.getId()).orElseThrow();
        List<?> transactions = paymentTransactionService.getPayments(org.springframework.data.domain.PageRequest.of(0, 20), null).getData();

        assertThat(charge.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(refreshedOrder.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(transactions).isNotEmpty();
    }

    private Order createSimpleOrder() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerName("Thanh toán test");
        request.setCustomerPhone("0901234567");
        request.setStatus(OrderStatus.PENDING);
        request.setPaymentStatus(PaymentStatus.UNPAID);
        request.setShippingAddress("12 Đường Mẫu, Quận 1");

        OrderItemRequest itemRequest = new OrderItemRequest();
        itemRequest.setProductName("Áo thun premium");
        itemRequest.setQuantity(1);
        itemRequest.setUnitPrice(BigDecimal.valueOf(250000));
        request.setItems(List.of(itemRequest));

        String orderId = orderService.create(request).getId();
        return orderRepository.findById(orderId).orElseThrow();
    }
}
