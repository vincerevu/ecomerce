package com.project.ecommerce.modules.content.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PresignedUrlResponse {
    String uploadUrl;
    String publicUrl;
    String fileKey;
}
