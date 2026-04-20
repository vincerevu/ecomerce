package com.project.ecommerce.modules.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateSepayCheckoutRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String orderId;
}
