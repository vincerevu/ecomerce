package com.project.ecommerce.modules.payment.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.payment.sepay")
public class SepayProperties {
    private boolean enabled;
    private String baseUrl;
    private String apiToken;
    private String bankAccountNumber;
    private String bankBin;
    private String bankCode;
    private String webhookSecret;
    private Integer expiredMinutes = 30;
    private Integer testAmount = 2000;
}
