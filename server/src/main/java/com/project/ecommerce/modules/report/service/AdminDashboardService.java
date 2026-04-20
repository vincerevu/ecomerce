package com.project.ecommerce.modules.report.service;

import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.enums.PaymentStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.payment.entity.PaymentTransaction;
import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import com.project.ecommerce.modules.payment.repository.PaymentTransactionRepository;
import com.project.ecommerce.modules.product.repository.CategoryRepository;
import com.project.ecommerce.modules.product.repository.ProductRepository;
import com.project.ecommerce.modules.product.repository.ProductVariantRepository;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardMetricsResponse;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardOrderStatusResponse;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardPaymentChannelResponse;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardRecentOrderResponse;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardResponse;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardRevenuePointResponse;
import com.project.ecommerce.modules.report.dto.response.AdminDashboardStockAlertResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private static final int LOW_STOCK_THRESHOLD = 10;

    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard(Authentication authentication) {
        boolean canViewOrders = hasAuthority(authentication, "ORDER:VIEW");
        boolean canViewPayments = hasAuthority(authentication, "PAYMENT:VIEW");
        boolean canViewProducts = hasAuthority(authentication, "PRODUCT:VIEW");
        boolean canViewCategories = hasAuthority(authentication, "CATEGORY:VIEW");
        boolean canViewCustomers = hasAuthority(authentication, "USER:VIEW");

        List<ProductVariantRepository.LowStockProductSummary> lowStockProducts = canViewProducts
                ? productVariantRepository.findLowStockProductSummaries(LOW_STOCK_THRESHOLD)
                : Collections.emptyList();

        return AdminDashboardResponse.builder()
                .metrics(buildMetrics(canViewOrders, canViewPayments, canViewProducts, canViewCategories, canViewCustomers, lowStockProducts))
                .revenueTrend(canViewOrders ? buildRevenueTrend() : buildDefaultRevenueTrend())
                .orderStatuses(canViewOrders ? buildOrderStatuses() : Collections.emptyList())
                .paymentChannels(canViewPayments ? buildPaymentChannels() : Collections.emptyList())
                .recentOrders(canViewOrders ? buildRecentOrders() : Collections.emptyList())
                .stockAlerts(canViewProducts ? buildStockAlerts(lowStockProducts) : Collections.emptyList())
                .build();
    }

    private AdminDashboardMetricsResponse buildMetrics(
            boolean canViewOrders,
            boolean canViewPayments,
            boolean canViewProducts,
            boolean canViewCategories,
            boolean canViewCustomers,
            List<ProductVariantRepository.LowStockProductSummary> lowStockProducts) {
        return AdminDashboardMetricsResponse.builder()
                .totalOrders(canViewOrders ? orderRepository.count() : 0)
                .processingOrders(canViewOrders ? orderRepository.countByStatusIn(List.of(
                        OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PACKING, OrderStatus.SHIPPING)) : 0)
                .deliveredRevenue(canViewOrders ? toLong(orderRepository.sumTotalAmountByStatus(OrderStatus.DELIVERED)) : 0)
                .totalPayments(canViewPayments ? paymentTransactionRepository.countBy() : 0)
                .paidPayments(canViewPayments ? paymentTransactionRepository.countByStatus(PaymentStatus.PAID) : 0)
                .totalProducts(canViewProducts ? productRepository.count() : 0)
                .activeProducts(canViewProducts ? productRepository.countByStatus("ACTIVE") : 0)
                .lowStockProducts(canViewProducts ? lowStockProducts.size() : 0)
                .totalCustomers(canViewCustomers ? userRepository.countByType(UserType.CUSTOMER) : 0)
                .activeCustomers(canViewCustomers ? userRepository.countByTypeAndActiveTrue(UserType.CUSTOMER) : 0)
                .totalCategories(canViewCategories ? categoryRepository.count() : 0)
                .rootCategories(canViewCategories ? categoryRepository.countByParentIsNull() : 0)
                .build();
    }

    private List<AdminDashboardRevenuePointResponse> buildRevenueTrend() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);
        LocalDateTime startDateTime = startDate.atStartOfDay();
        List<Order> deliveredOrders = orderRepository.findByStatusAndCreatedAtGreaterThanEqual(
                OrderStatus.DELIVERED,
                startDateTime,
                PageRequest.of(0, 500));

        Map<LocalDate, Long> dailyTotals = new java.util.HashMap<>();
        for (Order order : deliveredOrders) {
            if (order.getCreatedAt() == null) {
                continue;
            }
            LocalDate orderDate = order.getCreatedAt().toLocalDate();
            dailyTotals.merge(orderDate, toLong(order.getTotalAmount()), Long::sum);
        }

        return java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(index -> {
                    LocalDate current = startDate.plusDays(index);
                    return AdminDashboardRevenuePointResponse.builder()
                            .label(current.getDayOfWeek().getDisplayName(TextStyle.SHORT, new Locale("vi", "VN")))
                            .value(dailyTotals.getOrDefault(current, 0L))
                            .build();
                })
                .toList();
    }

    private List<AdminDashboardRevenuePointResponse> buildDefaultRevenueTrend() {
        LocalDate startDate = LocalDate.now().minusDays(6);
        return java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(index -> {
                    LocalDate current = startDate.plusDays(index);
                    return AdminDashboardRevenuePointResponse.builder()
                            .label(current.getDayOfWeek().getDisplayName(TextStyle.SHORT, new Locale("vi", "VN")))
                            .value(0)
                            .build();
                })
                .toList();
    }

    private List<AdminDashboardOrderStatusResponse> buildOrderStatuses() {
        long total = Math.max(orderRepository.count(), 1);
        List<AdminDashboardOrderStatusResponse> rows = List.of(
                buildOrderStatusRow("Chờ xác nhận", orderRepository.countByStatus(OrderStatus.PENDING), "bg-amber-400", total),
                buildOrderStatusRow("Đóng gói / xác nhận", orderRepository.countByStatusIn(List.of(OrderStatus.CONFIRMED, OrderStatus.PACKING)), "bg-sky-400", total),
                buildOrderStatusRow("Đang giao", orderRepository.countByStatus(OrderStatus.SHIPPING), "bg-indigo-400", total),
                buildOrderStatusRow("Hoàn tất", orderRepository.countByStatus(OrderStatus.DELIVERED), "bg-emerald-400", total),
                buildOrderStatusRow("Đã hủy", orderRepository.countByStatus(OrderStatus.CANCELLED), "bg-rose-400", total));
        return rows;
    }

    private AdminDashboardOrderStatusResponse buildOrderStatusRow(String label, long count, String barClass, long total) {
        return AdminDashboardOrderStatusResponse.builder()
                .label(label)
                .count(count)
                .percent(Math.max(6, Math.round((double) count * 100 / total)))
                .barClass(barClass)
                .build();
    }

    private List<AdminDashboardPaymentChannelResponse> buildPaymentChannels() {
        long totalPayments = Math.max(paymentTransactionRepository.countBy(), 1);
        Map<PaymentProvider, String> labels = new EnumMap<>(PaymentProvider.class);
        labels.put(PaymentProvider.MANUAL, "Thủ công");
        labels.put(PaymentProvider.MOMO, "MoMo");
        labels.put(PaymentProvider.VNPAY, "VNPay");
        labels.put(PaymentProvider.ZALOPAY, "ZaloPay");
        labels.put(PaymentProvider.STRIPE, "Stripe");

        Map<PaymentProvider, String> colors = new EnumMap<>(PaymentProvider.class);
        colors.put(PaymentProvider.MANUAL, "bg-slate-400");
        colors.put(PaymentProvider.MOMO, "bg-fuchsia-400");
        colors.put(PaymentProvider.VNPAY, "bg-sky-400");
        colors.put(PaymentProvider.ZALOPAY, "bg-emerald-400");
        colors.put(PaymentProvider.STRIPE, "bg-violet-400");

        return paymentTransactionRepository.summarizeByProvider().stream()
                .map(item -> AdminDashboardPaymentChannelResponse.builder()
                        .label(labels.getOrDefault(item.getProvider(), item.getProvider().name()))
                        .count(item.getCount())
                        .amount(toLong(item.getAmount()))
                        .percent(Math.round((double) item.getCount() * 100 / totalPayments))
                        .barClass(colors.getOrDefault(item.getProvider(), "bg-slate-400"))
                        .build())
                .sorted((left, right) -> Long.compare(right.getAmount(), left.getAmount()))
                .toList();
    }

    private List<AdminDashboardRecentOrderResponse> buildRecentOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5)).stream()
                .map(order -> AdminDashboardRecentOrderResponse.builder()
                        .id(order.getId())
                        .orderCode(order.getOrderCode())
                        .customerName(order.getCustomerName())
                        .itemCount(order.getItems() == null ? 0 : order.getItems().size())
                        .status(order.getStatus().name())
                        .totalAmount(toLong(order.getTotalAmount()))
                        .createdAt(order.getCreatedAt())
                        .build())
                .toList();
    }

    private List<AdminDashboardStockAlertResponse> buildStockAlerts(List<ProductVariantRepository.LowStockProductSummary> lowStockProducts) {
        return lowStockProducts.stream()
                .limit(5)
                .map(product -> AdminDashboardStockAlertResponse.builder()
                        .id(product.getProductId())
                        .name(product.getProductName())
                        .totalStock(product.getTotalStock())
                        .totalVariants(product.getVariantCount())
                        .build())
                .toList();
    }

    private boolean hasAuthority(Authentication authentication, String authority) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(item -> authority.equals(item.getAuthority()) || "ROLE_ADMIN".equals(item.getAuthority()));
    }

    private long toLong(BigDecimal value) {
        return value == null ? 0 : value.longValue();
    }
}
