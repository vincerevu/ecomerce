package com.project.ecommerce.modules.identity.dto.request;

import com.project.ecommerce.modules.identity.enums.Gender;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateUserProfileRequest {
    String name;
    String phone;
    String email;
    Gender gender;
    LocalDate dateOfBirth;
    String position;
    String address;
}
