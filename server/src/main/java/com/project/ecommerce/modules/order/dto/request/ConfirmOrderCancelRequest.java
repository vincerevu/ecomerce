package com.project.ecommerce.modules.order.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConfirmOrderCancelRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    @Pattern(regexp = "\\d{6}", message = "INVALID_OTP")
    String otp;
}
