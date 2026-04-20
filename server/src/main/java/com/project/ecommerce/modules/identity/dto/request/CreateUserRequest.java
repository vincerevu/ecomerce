package com.project.ecommerce.modules.identity.dto.request;

import com.project.ecommerce.common.validator.DobConstraint;
import com.project.ecommerce.modules.identity.enums.Gender;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUserRequest {
    @Pattern(regexp = "^(0[3|5|7|8|9])[0-9]{8}$", message = "INVALID_PHONE")
    String phone;

    @Size(min = 8, message = "INVALID_PASSWORD")
    String password;

    @Size(min = 5, message = "INVALID_NAME")
    String name;

    String email;
    Gender gender;
    @DobConstraint(min = 10, message = "INVALID_DOB")
    LocalDate dateOfBirth;
    String position;
    Boolean active;
    Set<String> roles;
}
