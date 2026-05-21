package com.project.ecommerce.modules.notification.template;

public class MessageTemplate {

    // Template cho mã OTP
    public static String otpTemplate(String otp) {
        return String.format("[BAGY] Ma xac thuc cua ban la: %s. Ma co hieu luc trong 5 phut. Vui long khong cung cap ma nay cho bat ky ai.", otp);
    }

    // Template cho thông báo đặt hàng thành công
    public static String orderSuccessTemplate(String orderCode, String customerName) {
        return String.format("[BAGY]Chao %s, don hang %s cua ban tai YODY da duoc tiep nhan. Chung toi se som lien he de giao hang.", customerName, orderCode);
    }

    // Template cho thông báo nâng hạng thành viên (Membership)
    public static String tierUpgradeTemplate(String tierName) {
        return String.format("[BAGY]Chuc mung! Ban da tro thanh thanh vien hang %s cua YODY. Nhieu uu dai dang cho don ban!", tierName);
    }
}