package com.project.ecommerce.modules.order.config;

import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.entity.OrderItem;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import java.util.ArrayList;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
@Slf4j
public class OrderDataRepairConfig {

    @Bean
    ApplicationRunner orderDataRepairRunner(OrderRepository orderRepository, ProductRepository productRepository,
            PlatformTransactionManager transactionManager) {
        return args -> {
            TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
            transactionTemplate.executeWithoutResult(status -> {
                boolean repairedAny = false;

                for (Order order : orderRepository.findAll()) {
                    boolean orderChanged = false;
                    for (OrderItem item : order.getItems()) {
                        if (item.getProductVariant() != null) {
                            continue;
                        }

                        Product product = productRepository.findBySlug(item.getProductSlug())
                                .orElse(null);
                        if (product == null) {
                            continue;
                        }
                        ProductVariant variant = ensureVariant(productRepository, product, item);

                        item.setProduct(product);
                        item.setProductVariant(variant);
                        orderChanged = true;
                    }

                    if (orderChanged) {
                        orderRepository.save(order);
                        repairedAny = true;
                    }
                }

                if (repairedAny) {
                    log.info("Repaired order items with missing product/productVariant references.");
                }
            });
        };
    }

    private ProductVariant ensureVariant(ProductRepository productRepository, Product product, OrderItem item) {
        for (ProductColor color : product.getColors()) {
            boolean sameColor = normalize(color.getColorName()).equals(normalize(item.getColorName()));
            if (!sameColor) {
                continue;
            }

            for (ProductVariant variant : color.getVariants()) {
                boolean sameSize = normalize(variant.getSizeName()).equals(normalize(item.getSizeName()));
                boolean samePrice = variant.getSalePrice() != null && variant.getSalePrice().compareTo(item.getUnitPrice()) == 0;
                if (sameSize && samePrice) {
                    return variant;
                }
            }

            ProductVariant newVariant = ProductVariant.builder()
                    .productColor(color)
                    .sizeName(item.getSizeName())
                    .salePrice(item.getUnitPrice())
                    .stockQuantity(25)
                    .build();
            color.getVariants().add(newVariant);

            if (color.getImages().isEmpty() && item.getImageUrl() != null) {
                color.getImages().add(ProductImage.builder()
                        .productColor(color)
                        .imageUrl(item.getImageUrl())
                        .imageType("image/jpeg")
                        .isMain(true)
                        .sortOrder(0)
                        .build());
            }

            productRepository.save(product);
            return newVariant;
        }

        ProductColor newColor = ProductColor.builder()
                .product(product)
                .colorName(item.getColorName())
                .hexCode("#111111")
                .images(new ArrayList<>())
                .variants(new ArrayList<>())
                .build();

        if (item.getImageUrl() != null) {
            newColor.getImages().add(ProductImage.builder()
                    .productColor(newColor)
                    .imageUrl(item.getImageUrl())
                    .imageType("image/jpeg")
                    .isMain(true)
                    .sortOrder(0)
                    .build());
        }

        ProductVariant newVariant = ProductVariant.builder()
                .productColor(newColor)
                .sizeName(item.getSizeName())
                .salePrice(item.getUnitPrice())
                .stockQuantity(25)
                .build();
        newColor.getVariants().add(newVariant);
        product.getColors().add(newColor);
        productRepository.save(product);
        return newVariant;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
