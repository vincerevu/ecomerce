package com.project.ecommerce.modules.shipping.dto.response;

import com.project.ecommerce.modules.shipping.enums.ShipmentStatus;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShipmentEventResponse {
    String id;
    String providerStatus;
    ShipmentStatus internalStatus;
    String description;
    LocalDateTime eventTime;
    String rawPayload;
}
