package com.project.ecommerce.common.aspect;

import com.project.ecommerce.common.annotation.RateLimit;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.common.service.RedisService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Field;
import java.util.concurrent.TimeUnit;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitAspect {
    private final RedisService redisService;

    @Before("@annotation(rateLimit)")
    public void checkRateLimit(JoinPoint joinPoint, RateLimit rateLimit) {
        String key = generateKey(joinPoint, rateLimit);

        // 1. Check current count
        Object currentCountObj = redisService.get(key);
        int currentCount = currentCountObj == null ? 0 : Integer.parseInt(currentCountObj.toString());

        if (currentCount >= rateLimit.limit()) {
            throw new AppException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }

        // 2. Increment
        if (currentCount == 0) {
            redisService.save(key, 1, rateLimit.period(), TimeUnit.SECONDS);
        } else {
            // Chỉ tăng giá trị, không reset TTL (để giữ nguyên period trôi qua)
            redisService.increment(key);
        }
    }

    private String generateKey(JoinPoint joinPoint, RateLimit rateLimit) {
        StringBuilder keyBuilder = new StringBuilder("ratelimit:");
        keyBuilder.append(rateLimit.key().isEmpty() ? joinPoint.getSignature().getName() : rateLimit.key());
        keyBuilder.append(":");

        switch (rateLimit.target()) {
            case IP:
                keyBuilder.append(getClientIp());
                break;
            case USER:
                // TODO: Get User ID from SecurityContext
                keyBuilder.append("user_id_placeholder");
                break;
            case FIELD:
                keyBuilder.append(getFieldValue(joinPoint, rateLimit.fieldName()));
                break;
        }
        return keyBuilder.toString();
    }

    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            return xForwardedFor != null ? xForwardedFor : request.getRemoteAddr();
        }
        return "unknown";
    }

    private String getFieldValue(JoinPoint joinPoint, String fieldName) {
        Object[] args = joinPoint.getArgs();
        for (Object arg : args) {
            try {
                Field field = arg.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                return field.get(arg).toString();
            } catch (Exception ignored) {
                // Ignore if field not found in this arg, try next arg
            }
        }
        return "unknown_field";
    }
}
