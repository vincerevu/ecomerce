package com.project.ecommerce.modules.identity.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RefreshResponse {
    String accessToken;
    String refreshToken;
}
