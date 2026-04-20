package com.project.ecommerce.modules.shipping.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(GhnProperties.class)
public class ShippingConfig {
}
