package com.project.ecommerce.modules.identity.dto.request;

import lombok.Data;

@Data
public class LoginRequest {
    private String phone;
    private String password;
}
