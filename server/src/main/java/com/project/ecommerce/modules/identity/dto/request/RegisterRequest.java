package com.project.ecommerce.modules.identity.dto.request;

import com.project.ecommerce.common.validator.DobConstraint;
import com.project.ecommerce.modules.identity.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    @NotBlank(message = "FIELD_REQUIRED")
    @Pattern(regexp = "^\\d{10}$", message = "INVALID_PHONE")
    String phone;

    @Size(min = 8, message = "INVALID_PASSWORD")
    String password;

    @NotBlank(message = "FIELD_REQUIRED")
    String name;

    @DobConstraint(min = 16, message = "INVALID_DOB")
    LocalDate dateOfBirth;

    Gender gender;

    @NotBlank(message = "FIELD_REQUIRED")
    String otp;
}
