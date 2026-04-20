package com.project.ecommerce.common.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder

public class ApiResponse<T> {
    private int code;       // Mã kết quả (ví dụ: 1000 - Thành công)
    private String message; // Thông báo
    private T result;       // Dữ liệu thực tế trả về
}
