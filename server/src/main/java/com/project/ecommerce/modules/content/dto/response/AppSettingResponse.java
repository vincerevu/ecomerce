package com.project.ecommerce.modules.content.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppSettingResponse {
    String key;
    String value;
    String description;
    String group;
    LocalDateTime updatedAt;
}
