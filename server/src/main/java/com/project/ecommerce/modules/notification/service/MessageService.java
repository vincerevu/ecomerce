package com.project.ecommerce.modules.notification.service;

import com.project.ecommerce.modules.notification.template.MessageTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    private final SmsService smsService;

    public void sendOtp(String phone, String otp) {
        String content = MessageTemplate.otpTemplate(otp);
        smsService.sendSms(phone, content);
    }

    public void sendOrderConfirmation(String phone, String orderCode, String customerName) {
        String content = MessageTemplate.orderSuccessTemplate(orderCode, customerName);
        smsService.sendSms(phone, content);
    }
}
