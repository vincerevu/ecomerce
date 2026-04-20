package com.project.ecommerce.modules.order.config;

import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.entity.OrderItem;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;

@Configuration
@Slf4j
@ConditionalOnProperty(prefix = "app.seed.demo", name = "enabled", havingValue = "true")
public class OrderSampleDataConfig {

    @Bean
    ApplicationRunner orderSampleDataRunner(OrderRepository orderRepository, UserRepository userRepository,
            ProductRepository productRepository) {
        return args -> {
            if (orderRepository.count() > 0) {
                return;
            }

            User customer = userRepository.findByType(UserType.CUSTOMER, PageRequest.of(0, 1))
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (customer == null) {
                return;
            }

            log.info("Seeding sample orders for admin order management...");

            SampleCatalog catalog = new SampleCatalog(productRepository);

            seedOrder(orderRepository, customer, "ORD-20260317001", OrderStatus.PENDING, PaymentStatus.UNPAID,
                    catalog.sampleItems(2));

            seedOrder(orderRepository, customer, "ORD-20260317002", OrderStatus.CONFIRMED, PaymentStatus.PAID,
                    catalog.sampleItems(1));

            seedOrder(orderRepository, customer, "ORD-20260317003", OrderStatus.SHIPPING, PaymentStatus.PAID,
                    catalog.sampleItems(1));

            seedOrder(orderRepository, customer, "ORD-20260317004", OrderStatus.DELIVERED, PaymentStatus.PAID,
                    catalog.sampleItems(1));
        };
    }

    private void seedOrder(OrderRepository orderRepository, User customer, String orderCode, OrderStatus status,
            PaymentStatus paymentStatus, List<OrderItem> items) {
        if (items.isEmpty()) {
            return;
        }

        BigDecimal subtotal = items.stream()
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(customer)
                .customerName(customer.getName())
                .customerPhone(customer.getPhone())
                .customerEmail(customer.getEmail())
                .shippingAddress("123 Duong Mau, Quan 1, TP.HCM")
                .status(status)
                .paymentStatus(paymentStatus)
                .shippingFee(BigDecimal.valueOf(30000))
                .discountAmount(BigDecimal.ZERO)
                .subtotal(subtotal)
                .totalAmount(subtotal.add(BigDecimal.valueOf(30000)))
                .build();

        items.forEach(item -> item.setOrder(order));
        order.setItems(items);
        orderRepository.save(order);
    }

    private static final class SampleCatalog {
        private final ProductRepository productRepository;
        private int cursor = 0;

        private SampleCatalog(ProductRepository productRepository) {
            this.productRepository = productRepository;
        }

        private List<OrderItem> sampleItems(int count) {
            List<Product> products = productRepository.findAll().stream()
                    .filter(product -> product.getColors() != null && !product.getColors().isEmpty())
                    .filter(product -> product.getColors().stream().anyMatch(
                            color -> color.getVariants() != null && !color.getVariants().isEmpty()))
                    .toList();

            if (products.isEmpty()) {
                return List.of();
            }

            List<OrderItem> items = new java.util.ArrayList<>();
            for (int index = 0; index < count; index++) {
                Product product = products.get((cursor + index) % products.size());
                ProductColor productColor = product.getColors().stream()
                        .filter(color -> color.getVariants() != null && !color.getVariants().isEmpty())
                        .findFirst()
                        .orElse(null);
                if (productColor == null) {
                    continue;
                }
                ProductVariant variant = productColor.getVariants().getFirst();
                BigDecimal price = variant.getSalePrice() == null ? BigDecimal.ZERO : variant.getSalePrice();
                String imageUrl = productColor.getImages() != null && !productColor.getImages().isEmpty()
                        ? productColor.getImages().getFirst().getImageUrl()
                        : null;

                items.add(OrderItem.builder()
                        .product(product)
                        .productVariant(variant)
                        .productName(product.getName())
                        .productSlug(product.getSlug())
                        .colorName(productColor.getColorName())
                        .sizeName(variant.getSizeName())
                        .quantity(1)
                        .unitPrice(price)
                        .lineTotal(price)
                        .imageUrl(imageUrl)
                        .build());
            }

            cursor += Math.max(count, 1);
            return items;
        }
    }
}
