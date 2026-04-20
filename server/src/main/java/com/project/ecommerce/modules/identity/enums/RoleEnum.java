// ROLE enum
package com.project.ecommerce.modules.identity.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RoleEnum {
    ADMIN("Quản trị viên"),
    USER("Người dùng"),
    MANAGER("Quản lý"),
    SALES("Nhân viên bán hàng"),
    INVENTORY("Nhân viên kho"),
    SUPPORT("Hỗ trợ khách hàng"),
    OPERATOR("Vận hành"),
    ACCOUNTANT("Kế toán"),
    EMPLOYEE("Nhân viên (Cơ bản)");

    private final String displayName;
}