package com.project.ecommerce.modules.shipping.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.shipping.config.GhnProperties;
import com.project.ecommerce.modules.shipping.dto.response.ShippingAddressOptionResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingFeeResponse;
import com.project.ecommerce.modules.shipping.dto.response.ShippingServiceOptionResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
@RequiredArgsConstructor
@Slf4j
public class GhnHttpClient implements GhnClient {

    private final GhnProperties ghnProperties;
    private final ObjectMapper objectMapper;

    @Override
    public ShippingFeeResponse estimateFee(Integer fromDistrictId, Integer toDistrictId, String toWardCode,
            Integer serviceId, Integer serviceTypeId, BigDecimal insuranceValue, BigDecimal codAmount,
            Integer weight, Integer length, Integer width, Integer height) {
        Map<String, Object> body = new HashMap<>();
        body.put("from_district_id", resolveFromDistrictId(fromDistrictId));
        body.put("to_district_id", toDistrictId);
        body.put("to_ward_code", toWardCode);
        body.put("service_id", serviceId);
        body.put("service_type_id", serviceTypeId);
        body.put("insurance_value", defaultMoney(insuranceValue));
        body.put("cod_value", defaultMoney(codAmount));
        body.put("weight", weight);
        body.put("length", length);
        body.put("width", width);
        body.put("height", height);

        JsonNode data = post("/shiip/public-api/v2/shipping-order/fee", body);
        return ShippingFeeResponse.builder()
                .total(readDecimal(data, "total"))
                .serviceFee(readDecimal(data, "service_fee"))
                .insuranceFee(readDecimal(data, "insurance_fee"))
                .codFee(readDecimal(data, "cod_fee"))
                .build();
    }

    @Override
    public List<ShippingServiceOptionResponse> getAvailableServices(Integer fromDistrictId, Integer toDistrictId) {
        JsonNode data = post("/shiip/public-api/v2/shipping-order/available-services", Map.of(
                "shop_id", ghnProperties.getShopId(),
                "from_district", resolveFromDistrictId(fromDistrictId),
                "to_district", toDistrictId));

        return mapArray(data, item -> ShippingServiceOptionResponse.builder()
                .serviceId(item.path("service_id").isMissingNode() ? null : item.path("service_id").asInt())
                .shortName(item.path("short_name").asText(null))
                .serviceTypeId(item.path("service_type_id").asText(null))
                .build());
    }

    @Override
    public GhnShipmentCreatedResult createOrder(GhnCreateOrderCommand command) {
        validateCreateConfiguration(command);
        Map<String, Object> body = new HashMap<>();
        body.put("shop_id", ghnProperties.getShopId());
        body.put("payment_type_id", command.paymentTypeId() == null ? 1 : command.paymentTypeId());
        body.put("required_note", command.requiredNote());
        body.put("from_name", command.senderName());
        body.put("from_phone", command.senderPhone());
        body.put("from_address", command.senderAddress());
        body.put("from_ward_name", command.senderWardName());
        body.put("from_district_name", command.senderDistrictName());
        body.put("from_province_name", command.senderProvinceName());
        body.put("to_name", command.toName());
        body.put("to_phone", command.toPhone());
        body.put("to_address", command.toAddress());
        body.put("to_district_id", command.toDistrictId());
        body.put("to_ward_code", command.toWardCode());
        body.put("to_ward_name", command.toWardName());
        body.put("to_district_name", command.toDistrictName());
        body.put("to_province_name", command.toProvinceName());
        body.put("weight", command.weight());
        body.put("length", command.length());
        body.put("width", command.width());
        body.put("height", command.height());
        if (command.serviceId() != null) {
            body.put("service_id", command.serviceId());
        }
        if (command.serviceTypeId() != null) {
            body.put("service_type_id", command.serviceTypeId());
        }
        body.put("insurance_value", toIntegerMoney(command.insuranceValue()));
        body.put("cod_amount", toIntegerMoney(command.codAmount()));
        body.put("client_order_code", command.clientOrderCode());
        body.put("note", command.note());
        body.put("items", List.of(Map.of(
                "name", command.clientOrderCode(),
                "quantity", 1,
                "weight", command.weight(),
                "length", command.length(),
                "width", command.width(),
                "height", command.height())));

        JsonNode data = post("/shiip/public-api/v2/shipping-order/create", body);
        return new GhnShipmentCreatedResult(
                data.path("order_code").asText(null),
                data.path("status").asText("ready_to_pick"),
                parseDateTime(data.path("expected_delivery_time").asText(null)),
                readDecimal(data, "total_fee"),
                writeJson(data));
    }

    @Override
    public GhnShipmentTrackingResult getOrderDetailByClientOrderCode(String clientOrderCode) {
        JsonNode data = post("/shiip/public-api/v2/shipping-order/detail-by-client-code",
                Map.of("client_order_code", clientOrderCode));

        return new GhnShipmentTrackingResult(
                data.path("order_code").asText(null),
                data.path("status").asText("ready_to_pick"),
                parseDateTime(data.path("leadtime").asText(null)),
                data.path("status_name").asText(data.path("status").asText(null)),
                writeJson(data));
    }

    @Override
    public void cancelOrder(String trackingCode) {
        post("/shiip/public-api/v2/switch-status/cancel", Map.of("order_codes", List.of(trackingCode)));
    }

    @Override
    public List<ShippingAddressOptionResponse> getProvinces() {
        JsonNode data = get("/shiip/public-api/master-data/province");
        return mapArray(data, item -> ShippingAddressOptionResponse.builder()
                .code(item.path("ProvinceID").asText(null))
                .name(item.path("ProvinceName").asText(null))
                .build());
    }

    @Override
    public List<ShippingAddressOptionResponse> getDistricts(Integer provinceId) {
        JsonNode data = post("/shiip/public-api/master-data/district", Map.of("province_id", provinceId));
        return mapArray(data, item -> ShippingAddressOptionResponse.builder()
                .code(item.path("DistrictID").asText(null))
                .name(item.path("DistrictName").asText(null))
                .parentCode(item.path("ProvinceID").asText(null))
                .build());
    }

    @Override
    public List<ShippingAddressOptionResponse> getWards(Integer districtId) {
        JsonNode data = post("/shiip/public-api/master-data/ward", Map.of("district_id", districtId));
        return mapArray(data, item -> ShippingAddressOptionResponse.builder()
                .code(item.path("WardCode").asText(null))
                .name(item.path("WardName").asText(null))
                .parentCode(item.path("DistrictID").asText(null))
                .build());
    }

    private JsonNode get(String path) {
        return execute(path, null, true);
    }

    private JsonNode post(String path, Object body) {
        return execute(path, body, false);
    }

    private JsonNode execute(String path, Object body, boolean getMethod) {
        validateBaseConfiguration();
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl(ghnProperties.getBaseUrl())
                    .defaultHeaders(this::applyHeaders)
                    .build();

            JsonNode response = getMethod
                    ? restClient.get().uri(path).retrieve().body(JsonNode.class)
                    : restClient.post().uri(path).contentType(MediaType.APPLICATION_JSON).body(body).retrieve()
                            .body(JsonNode.class);

            if (response == null) {
                log.error("GHN returned null response for path {}", path);
                throw new AppException(ErrorCode.SHIPPING_PROVIDER_ERROR);
            }

            int code = response.path("code").asInt(200);
            if (code >= 300) {
                log.error("GHN returned error response for path {}: {}", path, writeJson(response));
                throw new AppException(ErrorCode.SHIPPING_PROVIDER_ERROR);
            }
            return response.path("data");
        } catch (RestClientResponseException exception) {
            log.error(
                    "GHN request failed for path {} with status {} and body {}. Request body: {}",
                    path,
                    exception.getStatusCode(),
                    exception.getResponseBodyAsString(),
                    writeObject(body));
            throw new AppException(ErrorCode.SHIPPING_PROVIDER_ERROR);
        } catch (RestClientException exception) {
            log.error("GHN request failed for path {}. Request body: {}", path, writeObject(body), exception);
            throw new AppException(ErrorCode.SHIPPING_PROVIDER_ERROR);
        }
    }

    private void applyHeaders(HttpHeaders headers) {
        headers.set("Token", ghnProperties.getToken());
        if (ghnProperties.getShopId() != null) {
            headers.set("ShopId", String.valueOf(ghnProperties.getShopId()));
        }
    }

    private void validateBaseConfiguration() {
        if (!StringUtils.hasText(ghnProperties.getBaseUrl()) || !StringUtils.hasText(ghnProperties.getToken())
                || ghnProperties.getShopId() == null) {
            throw new AppException(ErrorCode.SHIPPING_PROVIDER_CONFIG_INVALID);
        }
    }

    private void validateCreateConfiguration(GhnCreateOrderCommand command) {
        validateBaseConfiguration();
        if (!StringUtils.hasText(command.senderName()) || !StringUtils.hasText(command.senderPhone())
                || !StringUtils.hasText(command.senderAddress()) || !StringUtils.hasText(command.senderWardName())
                || !StringUtils.hasText(command.senderDistrictName())
                || !StringUtils.hasText(command.senderProvinceName())) {
            throw new AppException(ErrorCode.SHIPPING_PROVIDER_CONFIG_INVALID);
        }
    }

    private Integer resolveFromDistrictId(Integer fromDistrictId) {
        Integer resolved = fromDistrictId != null ? fromDistrictId : ghnProperties.getFromDistrictId();
        if (resolved == null) {
            throw new AppException(ErrorCode.SHIPPING_PROVIDER_CONFIG_INVALID);
        }
        return resolved;
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private int toIntegerMoney(BigDecimal value) {
        return defaultMoney(value).intValue();
    }

    private BigDecimal readDecimal(JsonNode node, String field) {
        return node.path(field).isMissingNode() || node.path(field).isNull()
                ? BigDecimal.ZERO
                : node.path(field).decimalValue();
    }

    private LocalDateTime parseDateTime(String rawValue) {
        if (!StringUtils.hasText(rawValue)) {
            return null;
        }
        try {
            if (rawValue.matches("\\d+")) {
                return LocalDateTime.ofInstant(Instant.ofEpochSecond(Long.parseLong(rawValue)), ZoneId.systemDefault());
            }
            return LocalDateTime.parse(rawValue.replace("Z", ""));
        } catch (Exception exception) {
            return null;
        }
    }

    private String writeJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception exception) {
            return node.toString();
        }
    }

    private String writeObject(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            return String.valueOf(value);
        }
    }

    private <T> List<T> mapArray(JsonNode data, Function<JsonNode, T> mapper) {
        if (data == null || !data.isArray()) {
            return List.of();
        }
        java.util.ArrayList<T> result = new java.util.ArrayList<>();
        data.forEach(node -> result.add(mapper.apply(node)));
        return result;
    }
}
