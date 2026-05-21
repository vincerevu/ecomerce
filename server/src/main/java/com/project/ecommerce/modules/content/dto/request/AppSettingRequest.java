package com.project.ecommerce.modules.content.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppSettingRequest {
    @NotBlank(message = "Setting value is required")
    String value;
    String description;
    String group;
}
