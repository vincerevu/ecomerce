package com.project.ecommerce.modules.order.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.identity.service.AuthenticationService;
import com.project.ecommerce.modules.identity.service.PointHistoryService;
import com.project.ecommerce.modules.order.dto.request.ConfirmOrderCancelRequest;
import com.project.ecommerce.modules.order.dto.request.CreateOrderRequest;
import com.project.ecommerce.modules.order.dto.request.OrderItemRequest;
import com.project.ecommerce.modules.order.dto.request.UpdateOrderReceiverRequest;
import com.project.ecommerce.modules.order.dto.request.UpdateOrderStatusRequest;
import com.project.ecommerce.modules.order.dto.response.OrderResponse;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.entity.OrderItem;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.mapper.OrderItemMapper;
import com.project.ecommerce.modules.order.mapper.OrderMapper;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.payment.service.PaymentTransactionService;
import com.project.ecommerce.modules.product.entity.ProductColor;
import com.project.ecommerce.modules.product.entity.ProductImage;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import com.project.ecommerce.modules.shipping.repository.ShipmentRepository;
import com.project.ecommerce.modules.shipping.service.ShipmentService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentService shipmentService;
    private final PointHistoryService pointHistoryService;
    private final AuthenticationService authenticationService;
    private final PaymentTransactionService paymentTransactionService;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;

    @Value("${app.loyalty.points-per-vnd:1000}")
    private int pointsPerVnd;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ORDER:VIEW')")
    public PageResponse<OrderResponse> getOrders(Pageable pageable, Specification<Order> spec) {
        Page<Order> orderPage = orderRepository.findAll(spec, pageable);
        return PageResponse.<OrderResponse>builder()
                .currentPage(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalPages(orderPage.getTotalPages())
                .totalElements(orderPage.getTotalElements())
                .last(orderPage.isLast())
                .data(orderPage.getContent().stream().map(orderMapper::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ORDER:VIEW')")
    public OrderResponse getOrderById(String id) {
        return orderMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    @PreAuthorize("hasAuthority('ORDER:CREATE')")
    public OrderResponse create(CreateOrderRequest request) {
        return createInternal(request, request.getUserId());
    }

    @Transactional
    public OrderResponse createForCheckout(CreateOrderRequest request, String authenticatedUserId) {
        String resolvedUserId = (request.getUserId() == null || request.getUserId().isBlank())
                ? authenticatedUserId
                : request.getUserId();
        return createInternal(request, resolvedUserId);
    }

    private OrderResponse createInternal(CreateOrderRequest request, String resolvedUserId) {
        Order order = orderMapper.toEntity(request);
        order.setOrderCode(resolveOrderCode(request.getOrderCode()));
        order.setUser(resolveUser(resolvedUserId));
        applyItems(order, request.getItems());
        recalculateTotals(order);
        return orderMapper.toResponse(orderRepository.save(order));
    }

    @Transactional
    @PreAuthorize("hasAuthority('ORDER:UPDATE')")
    public OrderResponse updateStatus(String id, UpdateOrderStatusRequest request) {
        Order order = findOrThrow(id);
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(request.getStatus());
        if (request.getPaymentStatus() != null) {
            order.setPaymentStatus(request.getPaymentStatus());
        }
        Order savedOrder = orderRepository.save(order);
        if (previousStatus != OrderStatus.CONFIRMED
                && savedOrder.getStatus() == OrderStatus.CONFIRMED
                && !shipmentRepository.existsByOrderId(savedOrder.getId())) {
            shipmentService.createShipmentForConfirmedOrder(savedOrder);
        }
        if (previousStatus != OrderStatus.DELIVERED && savedOrder.getStatus() == OrderStatus.DELIVERED) {
            awardPointsForDeliveredOrder(savedOrder);
        }
        return orderMapper.toResponse(savedOrder);
    }

    @Transactional
    @PreAuthorize("hasAuthority('ORDER:UPDATE')")
    public OrderResponse updateReceiver(String id, UpdateOrderReceiverRequest request) {
        Order order = findOrThrow(id);
        order.setCustomerName(request.getCustomerName().trim());
        order.setCustomerPhone(request.getCustomerPhone().replaceAll("\\s+", ""));
        if (!StringUtils.hasText(order.getShippingAddress()) && StringUtils.hasText(order.getShippingDetail())) {
            order.setShippingAddress(order.getShippingDetail());
        }
        return orderMapper.toResponse(orderRepository.save(order));
    }

    @Transactional
    @PreAuthorize("hasAuthority('ORDER:DELETE')")
    public void delete(String id) {
        Order order = findOrThrow(id);
        order.setIsDeleted(true);
        orderRepository.save(order);
    }

    @Transactional
    public void sendCancelOtp(String orderId, String userId) {
        Order order = findOwnedOrder(orderId, userId);
        ensureOrderCanBeCancelled(order);
        authenticationService.sendOrderCancelOtp(order.getCustomerPhone());
    }

    @Transactional
    public OrderResponse confirmCancel(String orderId, String userId, ConfirmOrderCancelRequest request) {
        Order order = findOwnedOrder(orderId, userId);
        ensureOrderCanBeCancelled(order);
        authenticationService.verifyOrderCancelOtp(order.getCustomerPhone(), request.getOtp());

        order.setStatus(OrderStatus.CANCELLED);
        paymentTransactionService.failOpenChargeTransactions(order, "Order cancelled by customer via OTP");
        return orderMapper.toResponse(orderRepository.save(order));
    }

    private Order findOrThrow(String id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private Order findOwnedOrder(String orderId, String userId) {
        Order order = findOrThrow(orderId);
        String ownerId = order.getUser() != null ? order.getUser().getId() : null;
        if (ownerId == null || !ownerId.equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return order;
    }

    private User resolveUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private String resolveOrderCode(String requestedCode) {
        if (requestedCode != null && !requestedCode.isBlank()) {
            if (orderRepository.existsByOrderCode(requestedCode)) {
                throw new AppException(ErrorCode.ORDER_CODE_ALREADY_EXISTS);
            }
            return requestedCode;
        }

        String generatedCode = "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        if (orderRepository.existsByOrderCode(generatedCode)) {
            generatedCode = generatedCode + "-" + System.currentTimeMillis() % 1000;
        }
        return generatedCode;
    }

    private void applyItems(Order order, List<OrderItemRequest> itemRequests) {
        List<OrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemRequest : itemRequests) {
            OrderItem item = orderItemMapper.toEntity(itemRequest);
            item.setOrder(order);
            hydrateItemRelationsAndSnapshot(item, itemRequest);
            item.setLineTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            items.add(item);
        }

        order.setItems(items);
    }

    private void hydrateItemRelationsAndSnapshot(OrderItem item, OrderItemRequest itemRequest) {
        ProductVariant productVariant = resolveVariant(itemRequest.getProductVariantId());
        if (productVariant != null) {
            ProductColor productColor = productVariant.getProductColor();
            var product = productColor.getProduct();
            item.setProductVariant(productVariant);
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setProductSlug(product.getSlug());
            item.setColorName(productColor.getColorName());
            item.setSizeName(productVariant.getSizeName());
            item.setUnitPrice(productVariant.getSalePrice());
            item.setImageUrl(resolveVariantImage(productColor));
            return;
        }

        item.setProduct(itemRequest.getProductId() != null && !itemRequest.getProductId().isBlank()
                ? productRepository.findById(itemRequest.getProductId()).orElse(null)
                : null);
    }

    private ProductVariant resolveVariant(String productVariantId) {
        if (productVariantId == null || productVariantId.isBlank()) {
            return null;
        }
        return productVariantRepository.findById(productVariantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND));
    }

    private String resolveVariantImage(ProductColor productColor) {
        if (productColor.getImages() == null || productColor.getImages().isEmpty()) {
            return null;
        }

        return productColor.getImages().stream()
                .sorted(Comparator
                        .comparing((ProductImage image) -> !image.isMain())
                        .thenComparing(image -> image.getSortOrder() == null ? Integer.MAX_VALUE : image.getSortOrder()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(null);
    }

    private void recalculateTotals(Order order) {
        BigDecimal subtotal = order.getItems().stream()
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setSubtotal(subtotal);

        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal discountAmount = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        order.setShippingFee(shippingFee);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(subtotal.add(shippingFee).subtract(discountAmount));
    }

    private void ensureOrderCanBeCancelled(Order order) {
        boolean isPendingOrder = order.getStatus() == OrderStatus.PENDING;
        boolean isSettledPayment = order.getPaymentStatus() == PaymentStatus.PAID
                || order.getPaymentStatus() == PaymentStatus.PARTIALLY_PAID
                || order.getPaymentStatus() == PaymentStatus.REFUNDED;

        if (!isPendingOrder || isSettledPayment) {
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_CANCELLED);
        }
    }

    private void awardPointsForDeliveredOrder(Order order) {
        if (order.getUser() == null || order.getUser().getId() == null) {
            return;
        }
        updateUserTotalSpent(order);
        if (pointsPerVnd <= 0) {
            return;
        }

        String userId = order.getUser().getId();
        if (pointHistoryService.hasAwardedPointsForOrder(userId, order.getId())) {
            return;
        }

        BigDecimal baseAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        int earnedPoints = baseAmount
                .divide(BigDecimal.valueOf(pointsPerVnd), 0, RoundingMode.DOWN)
                .intValue();

        if (earnedPoints <= 0) {
            return;
        }

        pointHistoryService.addPointsToUser(
                userId,
                earnedPoints,
                "Cộng điểm từ đơn hàng " + order.getOrderCode(),
                order.getId());
    }

    private void updateUserTotalSpent(Order order) {
        User user = userRepository.findById(order.getUser().getId()).orElse(null);
        if (user == null) {
            return;
        }

        BigDecimal currentSpent = user.getTotalSpent() != null ? user.getTotalSpent() : BigDecimal.ZERO;
        BigDecimal orderTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        user.setTotalSpent(currentSpent.add(orderTotal));
        userRepository.save(user);
    }
}
