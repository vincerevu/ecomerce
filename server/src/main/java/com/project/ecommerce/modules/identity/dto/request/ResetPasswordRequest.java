package com.project.ecommerce.modules.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {
    @Pattern(regexp = "^\\d{10}$", message = "INVALID_PHONE")
    String phone;

    @NotBlank(message = "FIELD_REQUIRED")
    String otp;

    @Size(min = 6, message = "INVALID_PASSWORD")
    String newPassword;
}
