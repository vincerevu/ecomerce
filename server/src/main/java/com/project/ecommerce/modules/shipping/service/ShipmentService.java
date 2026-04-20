package com.project.ecommerce.modules.shipping.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.order.entity.Order;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;
import com.project.ecommerce.modules.shipping.client.GhnClient;
import com.project.ecommerce.modules.shipping.config.GhnProperties;
import com.project.ecommerce.modules.shipping.dto.request.AvailableShippingServiceRequest;
import com.project.ecommerce.modules.shipping.dto.request.CreateShipmentRequest;
import com.project.ecommerce.modules.shipping.dto.request.EstimateShippingFeeRequest;
import com.project.ecommerce.modules.shipping.dto.response.ShipmentEventResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShipmentResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingAddressOptionResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingFeeResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingServiceOptionResponse;
import com.project.ecommerce.modules.shipping.entity.Shipment;
import com.project.ecommerce.modules.shipping.entity.ShipmentEvent;
import com.project.ecommerce.modules.shipping.enums.RequiredNoteType;
import com.project.ecommerce.modules.shipping.enums.ShipmentStatus;
import com.project.ecommerce.modules.shipping.enums.ShippingProvider;
import com.project.ecommerce.modules.shipping.mapper.ShipmentEventMapper;
import com.project.ecommerce.modules.shipping.mapper.ShipmentMapper;
import com.project.ecommerce.modules.shipping.repository.ShipmentEventRepository;
import com.project.ecommerce.modules.shipping.repository.ShipmentRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository shipmentEventRepository;
    private final OrderRepository orderRepository;
    private final ShipmentMapper shipmentMapper;
    private final ShipmentEventMapper shipmentEventMapper;
    private final GhnClient ghnClient;
    private final GhnProperties ghnProperties;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('SHIPMENT:VIEW')")
    public PageResponse<ShipmentResponse> getShipments(Pageable pageable, Specification<Shipment> spec) {
        Page<Shipment> shipmentPage = shipmentRepository.findAll(spec, pageable);
        return PageResponse.<ShipmentResponse>builder()
                .currentPage(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalPages(shipmentPage.getTotalPages())
                .totalElements(shipmentPage.getTotalElements())
                .last(shipmentPage.isLast())
                .data(shipmentPage.getContent().stream().map(this::toResponse).toList())
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('SHIPMENT:VIEW')")
    public ShipmentResponse getById(String id) {
        return toResponse(findShipment(id));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('SHIPMENT:VIEW')")
    public ShipmentResponse getByOrderId(String orderId) {
        Shipment shipment = shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.SHIPMENT_NOT_FOUND));
        return toResponse(shipment);
    }

    @Transactional(readOnly = true)
    public ShippingFeeResponse estimateFee(EstimateShippingFeeRequest request) {
        return ghnClient.estimateFee(
                request.getFromDistrictId(),
                request.getToDistrictId(),
                request.getToWardCode(),
                request.getServiceId(),
                request.getServiceTypeId(),
                request.getInsuranceValue(),
                request.getCodAmount(),
                request.getWeight(),
                request.getLength(),
                request.getWidth(),
                request.getHeight());
    }

    @Transactional(readOnly = true)
    public List<ShippingServiceOptionResponse> getAvailableServices(AvailableShippingServiceRequest request) {
        return ghnClient.getAvailableServices(request.getFromDistrictId(), request.getToDistrictId());
    }

    @Transactional(readOnly = true)
    public List<ShippingAddressOptionResponse> getProvinces() {
        return ghnClient.getProvinces();
    }

    @Transactional(readOnly = true)
    public List<ShippingAddressOptionResponse> getDistricts(Integer provinceId) {
        return ghnClient.getDistricts(provinceId);
    }

    @Transactional(readOnly = true)
    public List<ShippingAddressOptionResponse> getWards(Integer districtId) {
        return ghnClient.getWards(districtId);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SHIPMENT:CREATE')")
    public ShipmentResponse createShipment(CreateShipmentRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        return createShipmentInternal(order, request);
    }

    @Transactional
    public ShipmentResponse createShipmentForConfirmedOrder(Order order) {
        if (order == null || shipmentRepository.existsByOrderId(order.getId()) || !canAutoCreateShipment(order)) {
            return null;
        }

        CreateShipmentRequest request = buildAutoShipmentRequest(order);
        return createShipmentInternal(order, request);
    }

    private ShipmentResponse createShipmentInternal(Order order, CreateShipmentRequest request) {
        if (shipmentRepository.existsByOrderId(order.getId())) {
            throw new AppException(ErrorCode.SHIPMENT_ALREADY_EXISTS_FOR_ORDER);
        }

        String clientOrderCode = resolveClientOrderCode(order, request.getClientOrderCode());

        GhnClient.GhnShipmentCreatedResult providerResult = ghnClient.createOrder(
                new GhnClient.GhnCreateOrderCommand(
                        clientOrderCode,
                        request.getServiceId(),
                        request.getServiceTypeId(),
                        request.getPaymentTypeId(),
                        (request.getRequiredNote() == null ? RequiredNoteType.CHOTHUHANG : request.getRequiredNote()).name(),
                        defaultMoney(request.getCodAmount()),
                        defaultMoney(request.getInsuranceValue()),
                        request.getWeight(),
                        request.getLength(),
                        request.getWidth(),
                        request.getHeight(),
                        request.getToName(),
                        request.getToPhone(),
                        request.getToAddress(),
                        request.getToDistrictId(),
                        request.getToWardCode(),
                        request.getToWardName(),
                        request.getToDistrictName(),
                        request.getToProvinceName(),
                        resolveValue(request.getSenderName(), ghnProperties.getSenderName()),
                        resolveValue(request.getSenderPhone(), ghnProperties.getSenderPhone()),
                        resolveValue(request.getSenderAddress(), ghnProperties.getSenderAddress()),
                        resolveValue(request.getSenderWardName(), ghnProperties.getSenderWardName()),
                        resolveValue(request.getSenderDistrictName(), ghnProperties.getSenderDistrictName()),
                        resolveValue(request.getSenderProvinceName(), ghnProperties.getSenderProvinceName()),
                        request.getNote()));

        Shipment shipment = Shipment.builder()
                .order(order)
                .provider(ShippingProvider.GHN)
                .clientOrderCode(clientOrderCode)
                .trackingCode(providerResult.trackingCode())
                .shopId(ghnProperties.getShopId())
                .serviceId(request.getServiceId())
                .serviceTypeId(request.getServiceTypeId())
                .paymentTypeId(request.getPaymentTypeId() == null ? 1 : request.getPaymentTypeId())
                .requiredNote(request.getRequiredNote() == null ? RequiredNoteType.CHOTHUHANG : request.getRequiredNote())
                .status(mapProviderStatus(providerResult.providerStatus()))
                .shippingFee(providerResult.totalFee())
                .codAmount(defaultMoney(request.getCodAmount()))
                .insuranceValue(defaultMoney(request.getInsuranceValue()))
                .weight(request.getWeight())
                .length(request.getLength())
                .width(request.getWidth())
                .height(request.getHeight())
                .toName(request.getToName())
                .toPhone(request.getToPhone())
                .toAddress(request.getToAddress())
                .toProvinceName(request.getToProvinceName())
                .toDistrictName(request.getToDistrictName())
                .toWardName(request.getToWardName())
                .toDistrictId(request.getToDistrictId())
                .toWardCode(request.getToWardCode())
                .senderName(resolveValue(request.getSenderName(), ghnProperties.getSenderName()))
                .senderPhone(resolveValue(request.getSenderPhone(), ghnProperties.getSenderPhone()))
                .senderAddress(resolveValue(request.getSenderAddress(), ghnProperties.getSenderAddress()))
                .senderProvinceName(resolveValue(request.getSenderProvinceName(), ghnProperties.getSenderProvinceName()))
                .senderDistrictName(resolveValue(request.getSenderDistrictName(), ghnProperties.getSenderDistrictName()))
                .senderWardName(resolveValue(request.getSenderWardName(), ghnProperties.getSenderWardName()))
                .fromDistrictId(request.getFromDistrictId() == null ? ghnProperties.getFromDistrictId() : request.getFromDistrictId())
                .expectedDeliveryTime(providerResult.expectedDeliveryTime())
                .note(request.getNote())
                .providerPayload(providerResult.rawPayload())
                .build();

        Shipment savedShipment = shipmentRepository.save(shipment);
        appendEvent(savedShipment, providerResult.providerStatus(), savedShipment.getStatus(),
                "Tạo vận đơn GHN thành công", providerResult.expectedDeliveryTime(), providerResult.rawPayload());
        syncOrderStatus(order, savedShipment.getStatus());
        return toResponse(savedShipment);
    }

    private boolean canAutoCreateShipment(Order order) {
        return StringUtils.hasText(order.getShippingDetail())
                && StringUtils.hasText(order.getShippingProvinceName())
                && StringUtils.hasText(order.getShippingDistrictName())
                && StringUtils.hasText(order.getShippingWardName())
                && StringUtils.hasText(order.getShippingDistrictCode())
                && StringUtils.hasText(order.getShippingWardCode())
                && StringUtils.hasText(order.getCustomerName())
                && StringUtils.hasText(order.getCustomerPhone());
    }

    private CreateShipmentRequest buildAutoShipmentRequest(Order order) {
        Integer toDistrictId = Integer.valueOf(order.getShippingDistrictCode());
        List<ShippingServiceOptionResponse> availableServices =
                ghnClient.getAvailableServices(ghnProperties.getFromDistrictId(), toDistrictId);

        ShippingServiceOptionResponse selectedService = availableServices.stream()
                .filter(service -> service.getServiceId() != null)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SHIPPING_PROVIDER_ERROR));

        int totalQuantity = order.getItems() == null
                ? 1
                : Math.max(1, order.getItems().stream().mapToInt(item -> Math.max(item.getQuantity(), 0)).sum());
        int length = order.getSubtotal() != null && order.getSubtotal().compareTo(BigDecimal.valueOf(3_000_000)) > 0
                ? 32
                : 28;
        int width = totalQuantity > 3 ? 24 : 20;
        int height = Math.max(8, Math.min(24, totalQuantity * 3));
        int weight = Math.max(200, totalQuantity * 350);

        CreateShipmentRequest request = new CreateShipmentRequest();
        request.setOrderId(order.getId());
        request.setFromDistrictId(ghnProperties.getFromDistrictId());
        request.setServiceId(selectedService.getServiceId());
        request.setServiceTypeId(parseServiceTypeId(selectedService.getServiceTypeId()));
        request.setPaymentTypeId(1);
        request.setRequiredNote(RequiredNoteType.CHOTHUHANG);
        request.setCodAmount(order.getPaymentStatus() == null || order.getPaymentStatus().name().equals("UNPAID")
                || order.getPaymentStatus().name().equals("PENDING")
                || order.getPaymentStatus().name().equals("PARTIALLY_PAID")
                        ? defaultMoney(order.getTotalAmount())
                        : BigDecimal.ZERO);
        request.setInsuranceValue(defaultMoney(order.getSubtotal()));
        request.setWeight(weight);
        request.setLength(length);
        request.setWidth(width);
        request.setHeight(height);
        request.setToName(order.getCustomerName());
        request.setToPhone(order.getCustomerPhone());
        request.setToAddress(order.getShippingDetail());
        request.setToProvinceName(order.getShippingProvinceName());
        request.setToDistrictName(order.getShippingDistrictName());
        request.setToWardName(order.getShippingWardName());
        request.setToDistrictId(toDistrictId);
        request.setToWardCode(order.getShippingWardCode());
        request.setNote(order.getNotes());
        return request;
    }

    private Integer parseServiceTypeId(String serviceTypeId) {
        if (!StringUtils.hasText(serviceTypeId)) {
            return null;
        }
        try {
            return Integer.valueOf(serviceTypeId);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    @Transactional
    @PreAuthorize("hasAuthority('SHIPMENT:UPDATE')")
    public ShipmentResponse syncShipment(String id) {
        Shipment shipment = findShipment(id);
        GhnClient.GhnShipmentTrackingResult trackingResult = ghnClient
                .getOrderDetailByClientOrderCode(shipment.getClientOrderCode());

        ShipmentStatus newStatus = mapProviderStatus(trackingResult.providerStatus());
        shipment.setTrackingCode(trackingResult.trackingCode());
        shipment.setStatus(newStatus);
        shipment.setExpectedDeliveryTime(trackingResult.expectedDeliveryTime());
        shipment.setProviderPayload(trackingResult.rawPayload());
        Shipment savedShipment = shipmentRepository.save(shipment);

        appendEvent(savedShipment, trackingResult.providerStatus(), newStatus,
                trackingResult.description(), trackingResult.expectedDeliveryTime(), trackingResult.rawPayload());
        syncOrderStatus(savedShipment.getOrder(), newStatus);
        return toResponse(savedShipment);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SHIPMENT:UPDATE')")
    public ShipmentResponse cancelShipment(String id) {
        Shipment shipment = findShipment(id);
        ghnClient.cancelOrder(shipment.getTrackingCode());
        shipment.setStatus(ShipmentStatus.CANCELLED);
        Shipment savedShipment = shipmentRepository.save(shipment);
        appendEvent(savedShipment, "cancelled", ShipmentStatus.CANCELLED,
                "Đã gửi yêu cầu hủy vận đơn GHN", LocalDateTime.now(), null);
        syncOrderStatus(savedShipment.getOrder(), ShipmentStatus.CANCELLED);
        return toResponse(savedShipment);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SHIPMENT:DELETE')")
    public void deleteShipment(String id) {
        Shipment shipment = findShipment(id);
        shipment.setIsDeleted(true);
        shipmentRepository.save(shipment);
    }

    @Transactional
    public void handleGhnStatusWebhook(Map<String, Object> payload) {
        Map<String, Object> data = extractPayloadData(payload);
        String clientOrderCode = readString(data, "client_order_code", "ClientOrderCode");
        String trackingCode = readString(data, "order_code", "OrderCode");

        Optional<Shipment> optionalShipment = Optional.empty();
        if (StringUtils.hasText(clientOrderCode)) {
            optionalShipment = shipmentRepository.findByClientOrderCode(clientOrderCode.trim());
        }
        if (optionalShipment.isEmpty() && StringUtils.hasText(trackingCode)) {
            optionalShipment = shipmentRepository.findByTrackingCode(trackingCode.trim());
        }
        if (optionalShipment.isEmpty()) {
            return;
        }

        Shipment shipment = optionalShipment.get();
        String providerStatus = readString(data, "status", "Status", "current_status");
        ShipmentStatus shipmentStatus = mapProviderStatus(providerStatus);
        String description = readString(
                data,
                "description",
                "Description",
                "status_name",
                "StatusName",
                "message",
                "Message");
        LocalDateTime eventTime = parseEventTime(data);
        String rawPayload = toRawPayload(payload);

        if (StringUtils.hasText(trackingCode)) {
            shipment.setTrackingCode(trackingCode.trim());
        }
        shipment.setStatus(shipmentStatus);
        shipment.setProviderPayload(rawPayload);
        shipmentRepository.save(shipment);

        appendEvent(
                shipment,
                providerStatus,
                shipmentStatus,
                StringUtils.hasText(description) ? description : "GHN cập nhật trạng thái vận đơn",
                eventTime,
                rawPayload);
        syncOrderStatus(shipment.getOrder(), shipmentStatus);
    }

    private Shipment findShipment(String id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHIPMENT_NOT_FOUND));
    }

    private ShipmentResponse toResponse(Shipment shipment) {
        ShipmentResponse response = shipmentMapper.toResponse(shipment);
        List<ShipmentEventResponse> events = shipmentEventRepository.findAllByShipmentIdOrderByEventTimeDesc(shipment.getId())
                .stream()
                .map(shipmentEventMapper::toResponse)
                .toList();
        response.setEvents(events);
        return response;
    }

    private String resolveClientOrderCode(Order order, String requestedCode) {
        String clientOrderCode = StringUtils.hasText(requestedCode)
                ? requestedCode.trim()
                : "SHIP-" + order.getOrderCode();
        if (shipmentRepository.existsByClientOrderCode(clientOrderCode)) {
            throw new AppException(ErrorCode.SHIPMENT_CLIENT_ORDER_CODE_ALREADY_EXISTS);
        }
        return clientOrderCode;
    }

    private String resolveValue(String requestValue, String fallback) {
        return StringUtils.hasText(requestValue) ? requestValue.trim() : fallback;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractPayloadData(Map<String, Object> payload) {
        Object nestedData = payload.get("data");
        if (nestedData instanceof Map<?, ?> dataMap) {
            return (Map<String, Object>) dataMap;
        }
        return payload;
    }

    private String readString(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null && StringUtils.hasText(value.toString())) {
                return value.toString();
            }
        }
        return null;
    }

    private LocalDateTime parseEventTime(Map<String, Object> payload) {
        String rawTime = readString(
                payload,
                "updated_at",
                "UpdatedAt",
                "updated_date",
                "UpdatedDate",
                "action_at",
                "ActionAt");
        if (!StringUtils.hasText(rawTime)) {
            return LocalDateTime.now();
        }

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_DATE_TIME,
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"));

        for (DateTimeFormatter formatter : formatters) {
            try {
                if (formatter == DateTimeFormatter.ISO_DATE_TIME) {
                    return OffsetDateTime.parse(rawTime, formatter).toLocalDateTime();
                }
                return LocalDateTime.parse(rawTime, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return LocalDateTime.now();
    }

    private String toRawPayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ignored) {
            return payload.toString();
        }
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private ShipmentStatus mapProviderStatus(String providerStatus) {
        if (!StringUtils.hasText(providerStatus)) {
            return ShipmentStatus.CREATED;
        }
        String normalized = providerStatus.trim().toLowerCase();
        return switch (normalized) {
            case "ready_to_pick" -> ShipmentStatus.READY_TO_PICK;
            case "picking" -> ShipmentStatus.PICKING;
            case "delivering", "transporting", "sorting" -> ShipmentStatus.DELIVERING;
            case "delivered" -> ShipmentStatus.DELIVERED;
            case "return", "returning" -> ShipmentStatus.RETURNING;
            case "returned" -> ShipmentStatus.RETURNED;
            case "cancel", "cancelled" -> ShipmentStatus.CANCELLED;
            case "delivery_fail", "lost", "damage" -> ShipmentStatus.FAILED;
            default -> ShipmentStatus.CREATED;
        };
    }

    private void appendEvent(Shipment shipment, String providerStatus, ShipmentStatus internalStatus,
            String description, LocalDateTime eventTime, String rawPayload) {
        ShipmentEvent event = ShipmentEvent.builder()
                .shipment(shipment)
                .providerStatus(providerStatus)
                .internalStatus(internalStatus)
                .description(description)
                .eventTime(eventTime == null ? LocalDateTime.now() : eventTime)
                .rawPayload(rawPayload)
                .build();
        shipmentEventRepository.save(event);
    }

    private void syncOrderStatus(Order order, ShipmentStatus shipmentStatus) {
        switch (shipmentStatus) {
            case READY_TO_PICK, PICKING, CREATED -> {
                if (order.getStatus() == OrderStatus.PENDING) {
                    order.setStatus(OrderStatus.CONFIRMED);
                }
            }
            case DELIVERING -> order.setStatus(OrderStatus.SHIPPING);
            case DELIVERED -> order.setStatus(OrderStatus.DELIVERED);
            case CANCELLED, FAILED, RETURNED -> {
                if (order.getStatus() != OrderStatus.DELIVERED) {
                    order.setStatus(OrderStatus.CANCELLED);
                }
            }
            default -> {
            }
        }
        if (shipmentStatus == ShipmentStatus.CREATED || shipmentStatus == ShipmentStatus.READY_TO_PICK
                || shipmentStatus == ShipmentStatus.PICKING || shipmentStatus == ShipmentStatus.DELIVERING
                || shipmentStatus == ShipmentStatus.DELIVERED || shipmentStatus == ShipmentStatus.CANCELLED
                || shipmentStatus == ShipmentStatus.FAILED || shipmentStatus == ShipmentStatus.RETURNED) {
            orderRepository.save(order);
        }
    }
}
