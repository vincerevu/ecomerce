package com.project.ecommerce.modules.order.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.order.dto.request.CreateOrderRequest;
import com.project.ecommerce.modules.order.dto.request.OrderItemRequest;
import com.project.ecommerce.modules.order.dto.request.UpdateOrderStatusRequest;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class OrderServiceIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @Transactional
    @WithMockUser(authorities = { "ORDER:CREATE", "ORDER:VIEW", "ORDER:UPDATE", "ORDER:DELETE" })
    void createOrder_shouldPersistVariantReferenceAndSnapshot() {
        User customer = userRepository.save(User.builder()
                .phone("0977" + UUID.randomUUID().toString().substring(0, 6))
                .name("Order Test Customer")
                .email("order-test-" + UUID.randomUUID() + "@example.com")
                .type(UserType.CUSTOMER)
                .active(true)
                .roles(Set.of())
                .build());

        ProductVariant variant = createVariantProduct("Ao len co tron", "ao-len-co-tron", "Nau", "M", 299000);

        OrderItemRequest itemRequest = new OrderItemRequest();
        itemRequest.setProductVariantId(variant.getId());
        itemRequest.setProductId(variant.getProductColor().getProduct().getId());
        itemRequest.setProductName("Ignored by snapshot");
        itemRequest.setQuantity(2);
        itemRequest.setUnitPrice(BigDecimal.valueOf(299000));

        CreateOrderRequest request = new CreateOrderRequest();
        request.setUserId(customer.getId());
        request.setCustomerName(customer.getName());
        request.setCustomerPhone(customer.getPhone());
        request.setCustomerEmail(customer.getEmail());
        request.setShippingAddress("123 Test Street");
        request.setStatus(OrderStatus.PENDING);
        request.setPaymentStatus(PaymentStatus.UNPAID);
        request.setShippingFee(BigDecimal.valueOf(30000));
        request.setDiscountAmount(BigDecimal.valueOf(10000));
        request.setItems(List.of(itemRequest));

        var created = orderService.create(request);

        entityManager.flush();
        entityManager.clear();

        var loaded = orderService.getOrderById(created.getId());

        assertThat(loaded.getItems()).hasSize(1);
        assertThat(loaded.getItems().get(0).getProductId()).isEqualTo(variant.getProductColor().getProduct().getId());
        assertThat(loaded.getItems().get(0).getProductVariantId()).isEqualTo(variant.getId());
        assertThat(loaded.getItems().get(0).getProductName()).isEqualTo("Ao len co tron");
        assertThat(loaded.getItems().get(0).getColorName()).isEqualTo("Nau");
        assertThat(loaded.getItems().get(0).getSizeName()).isEqualTo("M");
        assertThat(loaded.getSubtotal()).isEqualByComparingTo("598000");
        assertThat(loaded.getTotalAmount()).isEqualByComparingTo("618000");
        assertThat(loaded.getItemCount()).isEqualTo(1);
    }

    @Test
    @Transactional
    @WithMockUser(authorities = { "ORDER:CREATE", "ORDER:VIEW", "ORDER:UPDATE" })
    void updateStatus_shouldUpdateOrderStatusAndPaymentStatus() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerName("Status Test");
        request.setCustomerPhone("0900009999");
        request.setStatus(OrderStatus.PENDING);
        request.setPaymentStatus(PaymentStatus.UNPAID);

        OrderItemRequest itemRequest = new OrderItemRequest();
        itemRequest.setProductName("Ao polo");
        itemRequest.setQuantity(1);
        itemRequest.setUnitPrice(BigDecimal.valueOf(199000));
        request.setItems(List.of(itemRequest));

        var created = orderService.create(request);

        UpdateOrderStatusRequest updateRequest = new UpdateOrderStatusRequest();
        updateRequest.setStatus(OrderStatus.SHIPPING);
        updateRequest.setPaymentStatus(PaymentStatus.PAID);

        var updated = orderService.updateStatus(created.getId(), updateRequest);

        assertThat(updated.getStatus()).isEqualTo(OrderStatus.SHIPPING);
        assertThat(updated.getPaymentStatus()).isEqualTo(PaymentStatus.PAID);
    }

    private ProductVariant createVariantProduct(String name, String slug, String color, String size, int unitPrice) {
        Product product = Product.builder()
                .name(name)
                .slug(slug + "-" + UUID.randomUUID())
                .description("Test product")
                .shortDescription("Test product")
                .material("Cotton")
                .status("ACTIVE")
                .colors(new ArrayList<>())
                .build();

        ProductColor productColor = ProductColor.builder()
                .product(product)
                .colorName(color)
                .hexCode("#654321")
                .images(new ArrayList<>())
                .variants(new ArrayList<>())
                .build();

        ProductImage image = ProductImage.builder()
                .productColor(productColor)
                .imageUrl("https://example.com/test-product.jpg")
                .imageType("image/jpeg")
                .isMain(true)
                .sortOrder(0)
                .build();

        ProductVariant variant = ProductVariant.builder()
                .productColor(productColor)
                .sizeName(size)
                .salePrice(BigDecimal.valueOf(unitPrice))
                .stockQuantity(12)
                .build();

        productColor.getImages().add(image);
        productColor.getVariants().add(variant);
        product.getColors().add(productColor);

        Product saved = productRepository.save(product);
        return productVariantRepository.findById(saved.getColors().get(0).getVariants().get(0).getId()).orElseThrow();
    }
}
