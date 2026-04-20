package com.project.ecommerce.modules.checkout.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.checkout.dto.request.CartItemRequest;
import com.project.ecommerce.modules.checkout.dto.request.UpdateCartItemRequest;
import com.project.ecommerce.modules.checkout.dto.response.CartItemResponse;
import com.project.ecommerce.modules.checkout.dto.response.CartResponse;
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
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CheckoutCartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional
    public CartResponse getMyCart(String userId) {
        Cart cart = findOrCreateCart(userId);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(String userId, CartItemRequest request) {
        Cart cart = findOrCreateCart(userId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        ProductVariant variant = productVariantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));

        validateVariantBelongsToProduct(product, variant);
        validateQuantity(request.getQuantity(), variant);

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> variant.getId().equals(item.getProductVariant().getId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            int nextQuantity = existingItem.getQuantity() + request.getQuantity();
            validateQuantity(nextQuantity, variant);
            existingItem.setQuantity(nextQuantity);
            existingItem.setUnitPrice(resolveUnitPrice(variant));
            hydrateSnapshot(existingItem, product, variant);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .productVariant(variant)
                    .quantity(request.getQuantity())
                    .unitPrice(resolveUnitPrice(variant))
                    .build();
            hydrateSnapshot(item, product, variant);
            cart.getItems().add(item);
        }

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateItem(String userId, String itemId, UpdateCartItemRequest request) {
        Cart cart = findOrCreateCart(userId);
        CartItem item = cart.getItems().stream()
                .filter(cartItem -> cartItem.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        ProductVariant variant = productVariantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
        Product product = variant.getProductColor().getProduct();
        validateVariantBelongsToProduct(product, variant);
        validateQuantity(request.getQuantity(), variant);

        CartItem duplicateItem = cart.getItems().stream()
                .filter(cartItem -> !cartItem.getId().equals(item.getId()))
                .filter(cartItem -> variant.getId().equals(cartItem.getProductVariant().getId()))
                .findFirst()
                .orElse(null);

        if (duplicateItem != null) {
            int mergedQuantity = duplicateItem.getQuantity() + request.getQuantity();
            validateQuantity(mergedQuantity, variant);
            duplicateItem.setQuantity(mergedQuantity);
            duplicateItem.setUnitPrice(resolveUnitPrice(variant));
            hydrateSnapshot(duplicateItem, product, variant);
            cart.getItems().remove(item);
        } else {
            item.setProduct(product);
            item.setProductVariant(variant);
            item.setQuantity(request.getQuantity());
            item.setUnitPrice(resolveUnitPrice(variant));
            hydrateSnapshot(item, product, variant);
        }

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(String userId, String itemId) {
        Cart cart = findOrCreateCart(userId);
        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse clearCart(String userId) {
        Cart cart = findOrCreateCart(userId);
        cart.getItems().clear();
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public void clearCartSilently(String userId) {
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart == null) {
            return;
        }
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private Cart findOrCreateCart(String userId) {
        if (userId == null || userId.isBlank() || "anonymousUser".equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder()
                        .user(userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)))
                        .items(new ArrayList<>())
                        .build()));
    }

    private void validateVariantBelongsToProduct(Product product, ProductVariant variant) {
        Product variantProduct = variant.getProductColor().getProduct();
        if (!variantProduct.getId().equals(product.getId())) {
            throw new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND);
        }
    }

    private void validateQuantity(Integer quantity, ProductVariant variant) {
        if (quantity == null || quantity < 1) {
            throw new AppException(ErrorCode.FIELD_REQUIRED);
        }
        if (variant.getStockQuantity() != null && variant.getStockQuantity() > 0 && quantity > variant.getStockQuantity()) {
            throw new AppException(ErrorCode.SHIPPING_PROVIDER_ERROR);
        }
    }

    private BigDecimal resolveUnitPrice(ProductVariant variant) {
        if (variant.getSalePrice() != null && variant.getSalePrice().compareTo(BigDecimal.ZERO) > 0) {
            return variant.getSalePrice();
        }
        return variant.getOriginalPrice() != null ? variant.getOriginalPrice() : BigDecimal.ZERO;
    }

    private void hydrateSnapshot(CartItem item, Product product, ProductVariant variant) {
        ProductColor color = variant.getProductColor();
        item.setProductName(product.getName());
        item.setProductSlug(product.getSlug());
        item.setColorId(color.getId());
        item.setColorName(color.getColorName());
        item.setSizeName(variant.getSizeName());
        item.setImageUrl(resolveImageUrl(color));
    }

    private String resolveImageUrl(ProductColor color) {
        if (color.getImages() == null || color.getImages().isEmpty()) {
            return null;
        }

        return color.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::isMain).reversed())
                .map(ProductImage::getImageUrl)
                .filter(url -> url != null && !url.isBlank())
                .findFirst()
                .orElse(null);
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .sorted(Comparator.comparing(CartItem::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toItemResponse)
                .toList();

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantity = items.stream()
                .map(CartItemResponse::getQuantity)
                .reduce(0, Integer::sum);

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(items)
                .subtotal(subtotal)
                .totalQuantity(totalQuantity)
                .build();
    }

    private CartItemResponse toItemResponse(CartItem item) {
        BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

        return CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productVariantId(item.getProductVariant().getId())
                .productName(item.getProductName())
                .productSlug(item.getProductSlug())
                .imageUrl(item.getImageUrl())
                .colorId(item.getColorId())
                .colorName(item.getColorName())
                .sizeName(item.getSizeName())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .lineTotal(lineTotal)
                .build();
    }
}
