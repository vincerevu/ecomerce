package com.project.ecommerce.modules.marketing.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
@RequiredArgsConstructor
public class CouponSchemaSyncConfig {

    private final TransactionTemplate transactionTemplate;

    @Bean
    @org.springframework.core.annotation.Order(260)
    ApplicationRunner couponSchemaSyncRunner(JdbcTemplate jdbcTemplate) {
        return args -> transactionTemplate.executeWithoutResult(status -> {
            jdbcTemplate.execute("""
                    ALTER TABLE coupons
                    ADD COLUMN IF NOT EXISTS scope VARCHAR(32) NOT NULL DEFAULT 'ALL'
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE coupons
                    ADD COLUMN IF NOT EXISTS target_membership_tier_id VARCHAR(255)
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE coupons
                    ADD COLUMN IF NOT EXISTS target_user_id VARCHAR(255)
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE coupons
                    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32) NOT NULL DEFAULT 'ALL'
                    """);
            addConstraintIfMissing(
                    jdbcTemplate,
                    "coupons_scope_check",
                    "ALTER TABLE coupons ADD CONSTRAINT coupons_scope_check "
                            + "CHECK (scope IN ('ALL', 'MEMBERSHIP_TIER', 'CUSTOMER'))");
            addConstraintIfMissing(
                    jdbcTemplate,
                    "coupons_payment_method_check",
                    "ALTER TABLE coupons ADD CONSTRAINT coupons_payment_method_check "
                            + "CHECK (payment_method IN ('ALL', 'COD', 'SEPAY'))");
            addConstraintIfMissing(
                    jdbcTemplate,
                    "coupons_target_membership_tier_fk",
                    "ALTER TABLE coupons ADD CONSTRAINT coupons_target_membership_tier_fk "
                            + "FOREIGN KEY (target_membership_tier_id) REFERENCES membership_tiers(id)");
            addConstraintIfMissing(
                    jdbcTemplate,
                    "coupons_target_user_fk",
                    "ALTER TABLE coupons ADD CONSTRAINT coupons_target_user_fk "
                            + "FOREIGN KEY (target_user_id) REFERENCES users(id)");
        });
    }

    private void addConstraintIfMissing(JdbcTemplate jdbcTemplate, String constraintName, String ddl) {
        Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_constraint WHERE conname = ?",
                Integer.class,
                constraintName);
        if (exists == null || exists == 0) {
            jdbcTemplate.execute(ddl);
        }
    }
}
