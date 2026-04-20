package com.project.ecommerce.common.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    // Generic
    UNCATEGORIZED_EXCEPTION(9999, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid request key", HttpStatus.BAD_REQUEST),
    FIELD_REQUIRED(1002, "This field is required", HttpStatus.BAD_REQUEST),

    // Auth / User
    USER_EXISTED(1003, "User already exists", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not found", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Access denied", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Age must be at least {min}", HttpStatus.BAD_REQUEST),
    INVALID_NAME(1009, "Name must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PHONE(1010, "Phone number must be 10 digits", HttpStatus.BAD_REQUEST),
    MESSAGE_SEND_ERROR(1011, "Failed to send message", HttpStatus.BAD_REQUEST),
    INVALID_OTP(1012, "Invalid OTP", HttpStatus.BAD_REQUEST),
    RATE_LIMIT_EXCEEDED(1013, "Too many requests, please try again later", HttpStatus.TOO_MANY_REQUESTS),
    RESOURCE_NOT_FOUND(1014, "Resource not found", HttpStatus.NOT_FOUND),
    INSUFFICIENT_POINTS(1015, "Insufficient points", HttpStatus.BAD_REQUEST),
    PASSWORD_MISMATCH(1016, "Passwords do not match", HttpStatus.BAD_REQUEST),
    INVALID_CURRENT_PASSWORD(1017, "Current password is incorrect", HttpStatus.BAD_REQUEST),
    USER_NOT_ACTIVE(1018, "Account is locked or inactive", HttpStatus.FORBIDDEN),
    PRODUCT_NOT_FOUND(1019, "Product not found", HttpStatus.NOT_FOUND),

    // Product
    INVALID_PRODUCT_NAME(1020, "Product name is required", HttpStatus.BAD_REQUEST),
    UPLOAD_SIZE_EXCEEDED(1021, "File size exceeds limit", HttpStatus.PAYLOAD_TOO_LARGE),
    PRODUCT_SLUG_ALREADY_EXISTS(1022, "Product slug already exists", HttpStatus.CONFLICT),
    ORDER_NOT_FOUND(1023, "Order not found", HttpStatus.NOT_FOUND),
    ORDER_CODE_ALREADY_EXISTS(1024, "Order code already exists", HttpStatus.CONFLICT),
    PRODUCT_VARIANT_NOT_FOUND(1025, "Product variant not found", HttpStatus.NOT_FOUND),
    PAYMENT_TRANSACTION_NOT_FOUND(1026, "Payment transaction not found", HttpStatus.NOT_FOUND),
    PAYMENT_TRANSACTION_CODE_ALREADY_EXISTS(1027, "Payment transaction code already exists", HttpStatus.CONFLICT),
    STOCK_IMPORT_RECEIPT_NOT_FOUND(1028, "Stock import receipt not found", HttpStatus.NOT_FOUND),
    STOCK_IMPORT_RECEIPT_CODE_ALREADY_EXISTS(1029, "Stock import receipt code already exists", HttpStatus.CONFLICT),
    SHIPMENT_NOT_FOUND(1030, "Shipment not found", HttpStatus.NOT_FOUND),
    SHIPMENT_ALREADY_EXISTS_FOR_ORDER(1031, "Shipment already exists for this order", HttpStatus.CONFLICT),
    SHIPMENT_CLIENT_ORDER_CODE_ALREADY_EXISTS(1032, "Shipment client order code already exists", HttpStatus.CONFLICT),
    SHIPPING_PROVIDER_CONFIG_INVALID(1033, "Shipping provider configuration is invalid", HttpStatus.BAD_REQUEST),
    SHIPPING_PROVIDER_ERROR(1034, "Shipping provider request failed", HttpStatus.BAD_GATEWAY),
    PAYMENT_PROVIDER_CONFIG_INVALID(1035, "Payment provider configuration is invalid", HttpStatus.BAD_REQUEST),
    PAYMENT_PROVIDER_ERROR(1036, "Payment provider request failed", HttpStatus.BAD_GATEWAY),
    ORDER_PAYMENT_NOT_ALLOWED(1037, "Order is not available for payment", HttpStatus.BAD_REQUEST),
    ORDER_PAYMENT_EXPIRED(1038, "Payment window for this order has expired", HttpStatus.BAD_REQUEST),
    ORDER_CANNOT_BE_CANCELLED(1039, "Order cannot be cancelled", HttpStatus.BAD_REQUEST),
    COLLECTION_SLUG_ALREADY_EXISTS(1040, "Collection slug already exists", HttpStatus.CONFLICT);

    private int code;
    private String message;
    private HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
