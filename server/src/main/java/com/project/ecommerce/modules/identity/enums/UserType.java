package com.project.ecommerce.modules.identity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum UserType {
    CUSTOMER("Khách hàng"),
    EMPLOYEE("Nhân viên");

    private final String displayName;
}
