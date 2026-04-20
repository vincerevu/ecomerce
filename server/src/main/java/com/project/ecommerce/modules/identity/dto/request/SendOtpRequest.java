package com.project.ecommerce.modules.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SendOtpRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    @Pattern(regexp = "^\\d{10}$", message = "INVALID_PHONE")
    String phone;
}
