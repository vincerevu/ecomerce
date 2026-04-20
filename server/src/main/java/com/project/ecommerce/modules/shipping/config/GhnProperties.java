package com.project.ecommerce.modules.shipping.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.shipping.ghn")
public class GhnProperties {
    private String baseUrl;
    private String token;
    private Long shopId;
    private Integer fromDistrictId;
    private String senderName;
    private String senderPhone;
    private String senderAddress;
    private String senderWardName;
    private String senderDistrictName;
    private String senderProvinceName;
}
