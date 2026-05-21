import axios from "axios";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:8888/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
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
  1023: "Không tìm thấy đơn hàng",
  1024: "Mã đơn hàng đã tồn tại",
  1025: "Không tìm thấy biến thể sản phẩm",
  1026: "Không tìm thấy giao dịch thanh toán",
  1027: "Mã giao dịch thanh toán đã tồn tại",
  1041: "Không tìm thấy mã giảm giá",
  1042: "Mã giảm giá đã tồn tại",
  1043: "Mã giảm giá chưa được kích hoạt",
  1045: "Mã giảm giá đã hết hạn",
  1051: "Mã giảm giá không áp dụng cho khách hàng này",
  1052: "Vui lòng chọn đối tượng áp dụng mã giảm giá",
  1048: "Không tìm thấy đánh giá",
  1050: "Đánh giá đã tồn tại",
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/admin/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token available");

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          token: refreshToken,
        });

        if (response.data.code === 1000) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.result;

          localStorage.setItem("accessToken", accessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }

        throw new Error("Refresh failed");
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/signin";
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
  },
);

export default apiClient;
