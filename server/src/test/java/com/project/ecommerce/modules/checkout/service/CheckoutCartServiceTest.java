package com.project.ecommerce.modules.checkout.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.checkout.dto.request.CartItemRequest;
import com.project.ecommerce.modules.checkout.dto.request.UpdateCartItemRequest;
import com.project.ecommerce.modules.checkout.entity.Cart;
import com.project.ecommerce.modules.checkout.entity.CartItem;
import com.project.ecommerce.modules.checkout.repository.CartItemRepository;
import com.project.ecommerce.modules.checkout.repository.CartRepository;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.product.entity.Product;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CheckoutCartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @InjectMocks
    private CheckoutCartService checkoutCartService;

    private User user;
    private Product product;
    private ProductColor color;
    private ProductVariant variant;
    private ProductVariant duplicateVariant;
    private Cart cart;

    @BeforeEach
    void setUp() {
        user = User.builder().id("user-1").phone("0911082004").name("Cart Tester").build();

        product = Product.builder()
                .id("product-1")
                .name("Ao khoac gio")
                .slug("ao-khoac-gio")
                .build();

        color = ProductColor.builder()
                .id("color-1")
                .product(product)
                .colorName("Den")
                .images(new ArrayList<>(List.of(ProductImage.builder()
                        .id("img-1")
                        .imageUrl("https://cdn.test/image-1.png")
                        .isMain(true)
                        .build())))
                .variants(new ArrayList<>())
                .build();

        variant = ProductVariant.builder()
                .id("variant-1")
                .productColor(color)
                .sizeName("M")
                .originalPrice(new BigDecimal("450000"))
                .salePrice(new BigDecimal("399000"))
                .stockQuantity(10)
                .build();

        duplicateVariant = ProductVariant.builder()
                .id("variant-2")
                .productColor(color)
                .sizeName("L")
                .originalPrice(new BigDecimal("450000"))
                .salePrice(new BigDecimal("399000"))
                .stockQuantity(10)
                .build();

        color.getVariants().addAll(List.of(variant, duplicateVariant));

        cart = Cart.builder().id("cart-1").user(user).items(new ArrayList<>()).build();
    }

    @Test
    void addItem_createsCartAndHydratesSnapshot() {
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.empty());
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(productRepository.findById("product-1")).thenReturn(Optional.of(product));
        when(productVariantRepository.findById("variant-1")).thenReturn(Optional.of(variant));

        var response = checkoutCartService.addItem(
                "user-1",
                CartItemRequest.builder()
                        .productId("product-1")
                        .productVariantId("variant-1")
                        .quantity(2)
                        .build());

        assertThat(response.getItems()).hasSize(1);
        var item = response.getItems().getFirst();
        assertThat(item.getProductName()).isEqualTo("Ao khoac gio");
        assertThat(item.getProductSlug()).isEqualTo("ao-khoac-gio");
        assertThat(item.getColorName()).isEqualTo("Den");
        assertThat(item.getSizeName()).isEqualTo("M");
        assertThat(item.getImageUrl()).isEqualTo("https://cdn.test/image-1.png");
        assertThat(item.getUnitPrice()).isEqualByComparingTo("399000");
        assertThat(item.getLineTotal()).isEqualByComparingTo("798000");
        assertThat(response.getSubtotal()).isEqualByComparingTo("798000");
        assertThat(response.getTotalQuantity()).isEqualTo(2);
    }

    @Test
    void updateItem_mergesDuplicateVariantIntoExistingLine() {
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CartItem primaryItem = CartItem.builder()
                .id("item-1")
                .cart(cart)
                .product(product)
                .productVariant(variant)
                .productName(product.getName())
                .productSlug(product.getSlug())
                .colorId(color.getId())
                .colorName(color.getColorName())
                .sizeName("M")
                .unitPrice(new BigDecimal("399000"))
                .quantity(1)
                .build();

        CartItem duplicateItem = CartItem.builder()
                .id("item-2")
                .cart(cart)
                .product(product)
                .productVariant(duplicateVariant)
                .productName(product.getName())
                .productSlug(product.getSlug())
                .colorId(color.getId())
                .colorName(color.getColorName())
                .sizeName("L")
                .unitPrice(new BigDecimal("399000"))
                .quantity(2)
                .build();

        cart.getItems().addAll(List.of(primaryItem, duplicateItem));

        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(productVariantRepository.findById("variant-2")).thenReturn(Optional.of(duplicateVariant));

        var response = checkoutCartService.updateItem(
                "user-1",
                "item-1",
                UpdateCartItemRequest.builder()
                        .productVariantId("variant-2")
                        .quantity(3)
                        .build());

        assertThat(response.getItems()).hasSize(1);
        var mergedItem = response.getItems().getFirst();
        assertThat(mergedItem.getProductVariantId()).isEqualTo("variant-2");
        assertThat(mergedItem.getQuantity()).isEqualTo(5);
        assertThat(mergedItem.getSizeName()).isEqualTo("L");
        assertThat(response.getSubtotal()).isEqualByComparingTo("1995000");
    }

    @Test
    void addItem_rejectsQuantityAboveStock() {
        when(cartRepository.findByUserId("user-1")).thenReturn(Optional.of(cart));
        when(productRepository.findById("product-1")).thenReturn(Optional.of(product));
        when(productVariantRepository.findById("variant-1")).thenReturn(Optional.of(variant));

        assertThatThrownBy(() -> checkoutCartService.addItem(
                        "user-1",
                        CartItemRequest.builder()
                                .productId("product-1")
                                .productVariantId("variant-1")
                                .quantity(99)
                                .build()))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SHIPPING_PROVIDER_ERROR);

        verify(cartRepository, never()).save(cart);
    }
}
