package com.project.ecommerce.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RateLimit {
    String key() default "";

    int limit() default 5;

    int period() default 60;

    RateLimitTarget target() default RateLimitTarget.IP;

    String fieldName() default "";
}
