package com.project.ecommerce.modules.message.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class SmsService {
    @Value("${app.message.sms.sender-name}")
    private String senderName;

    @Value("${app.message.sms.smsdev.base-url}")
    private String smsdevBaseUrl;

    public void sendSms(String toNumber, String messageText) {
        String formattedPhoneNumber = toNumber;
        if (formattedPhoneNumber.startsWith("0")) {
            formattedPhoneNumber = "84" + formattedPhoneNumber.substring(1);
        } else if (formattedPhoneNumber.startsWith("+")) {
            formattedPhoneNumber = formattedPhoneNumber.substring(1);
        }

        String payload = """
                {
                  "from": "%s",
                  "to": "%s",
                  "body": "%s"
                }
                """
                .formatted(
                        escapeJson(senderName),
                        escapeJson(formattedPhoneNumber),
                        escapeJson(messageText));

        IOException lastIoException = null;

        for (int attempt = 1; attempt <= 3; attempt++) {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) URI.create(smsdevBaseUrl + "/v1/messages").toURL().openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(10000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                connection.setRequestProperty("Accept", "application/json");
                connection.setRequestProperty("Connection", "close");

                try (OutputStream outputStream = connection.getOutputStream()) {
                    outputStream.write(payload.getBytes(StandardCharsets.UTF_8));
                }

                int statusCode = connection.getResponseCode();
                if (statusCode < 200 || statusCode >= 300) {
                    String errorBody = readStream(connection.getErrorStream());
                    log.error("sms-dev rejected SMS: status={}, body={}", statusCode, errorBody);
                    throw new AppException(ErrorCode.MESSAGE_SEND_ERROR);
                }

                log.info("Message captured by sms-dev for {} on attempt {}", formattedPhoneNumber, attempt);
                return;
            } catch (IOException e) {
                lastIoException = e;
                log.warn("sms-dev attempt {} failed for {}: {}", attempt, formattedPhoneNumber, e.getMessage());

                if (attempt < 3) {
                    try {
                        Thread.sleep(250L * attempt);
                    } catch (InterruptedException interruptedException) {
                        Thread.currentThread().interrupt();
                        throw new AppException(ErrorCode.MESSAGE_SEND_ERROR);
                    }
                }
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }

        log.error("Error sending SMS to sms-dev after retries: {}", lastIoException != null ? lastIoException.getMessage() : "unknown");
        throw new AppException(ErrorCode.MESSAGE_SEND_ERROR);
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }

    private String readStream(InputStream inputStream) throws IOException {
        if (inputStream == null) {
            return "";
        }

        return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }
}
