import axios from "axios";
import { clearAuthSession, getAccessToken, getRefreshToken } from "./auth-storage";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const ERROR_MAPPING: Record<number, string> = {
    9999: "Lỗi hệ thống không xác định",
    1001: "Lỗi không xác định",
    1002: "Vui lòng nhập đầy đủ các trường bắt buộc",
    1003: "Người dùng đã tồn tại",
    1004: "Mật khẩu không hợp lệ",
    1005: "Người dùng không tồn tại",
    1006: "Thông tin đăng nhập không hợp lệ",
    1007: "Bạn không có quyền thực hiện hành động này",
    1008: "Ngày sinh không hợp lệ",
    1009: "Tên không hợp lệ",
    1010: "Số điện thoại không hợp lệ",
    1011: "Lỗi gửi tin nhắn",
    1012: "Mã OTP không hợp lệ",
    1013: "Yêu cầu quá nhanh, vui lòng thử lại sau",
    1014: "Không tìm thấy tài nguyên",
    1015: "Số dư điểm không đủ",
    1016: "Mật khẩu không khớp",
    1017: "Mật khẩu hiện tại không chính xác",
    1018: "Tài khoản này chưa được kích hoạt",
    1037: "Đơn hàng này hiện không thể thanh toán",
    1038: "Đơn hàng đã quá hạn thanh toán",
    1039: "Đơn hàng này hiện không thể hủy",
};

apiClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = String(originalRequest?.url || "");
        const isAuthRequest =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/register/send-otp") ||
            requestUrl.includes("/auth/forgot-password/send-otp") ||
            requestUrl.includes("/auth/forgot-password/complete") ||
            requestUrl.includes("/auth/refresh");

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                const refreshResponse = await axios.post(
                    `${apiClient.defaults.baseURL}/auth/refresh`,
                    { token: refreshToken },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    },
                );

                if (refreshResponse.data?.code === 1000) {
                    const { accessToken, refreshToken: nextRefreshToken } = refreshResponse.data.result;

                    localStorage.setItem("accessToken", accessToken);
                    if (nextRefreshToken) {
                        localStorage.setItem("refreshToken", nextRefreshToken);
                    }

                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                }

                throw new Error("Refresh failed");
            } catch (refreshError) {
                clearAuthSession();
                if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
                    window.location.href = "/signin";
                }
                return Promise.reject(refreshError);
            }
        }

        const backendError = error.response?.data;
        if (backendError && backendError.code) {
            const translatedMessage = ERROR_MAPPING[backendError.code];
            if (translatedMessage) {
                backendError.message = translatedMessage;
            }
        }

        return Promise.reject(backendError || error);
    }
);

export default apiClient;
