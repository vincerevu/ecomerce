package com.project.ecommerce.modules.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateOrderReceiverRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String customerName;

    @NotBlank(message = "FIELD_REQUIRED")
    @Pattern(regexp = "^(0|84)(3|5|7|8|9)\\d{8}$", message = "PHONE_INVALID")
    String customerPhone;
}
