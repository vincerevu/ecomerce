package com.project.ecommerce.modules.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangePasswordRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    String currentPassword;

    @Size(min = 8, message = "INVALID_PASSWORD")
    String newPassword;

    @Size(min = 8, message = "INVALID_PASSWORD")
    String confirmPassword;
}
