package com.project.ecommerce.modules.shipping.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvailableShippingServiceRequest {
    Integer fromDistrictId;
    @NotNull
    Integer toDistrictId;
}
