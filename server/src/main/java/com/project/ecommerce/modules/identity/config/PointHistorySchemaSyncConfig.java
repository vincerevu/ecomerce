package com.project.ecommerce.modules.identity.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
@RequiredArgsConstructor
public class PointHistorySchemaSyncConfig {

    private final TransactionTemplate transactionTemplate;

    @Bean
    @org.springframework.core.annotation.Order(270)
    ApplicationRunner pointHistorySchemaSyncRunner(JdbcTemplate jdbcTemplate) {
        return args -> transactionTemplate.executeWithoutResult(status -> {
            jdbcTemplate.execute("""
                    UPDATE point_history
                    SET is_deleted = true
                    WHERE id IN (
                        SELECT id
                        FROM (
                            SELECT id,
                                   row_number() OVER (
                                       PARTITION BY user_id, order_id
                                       ORDER BY create_at ASC NULLS LAST, id ASC
                                   ) AS duplicate_rank
                            FROM point_history
                            WHERE order_id IS NOT NULL
                              AND is_deleted = false
                        ) ranked
                        WHERE duplicate_rank > 1
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS point_history_user_order_unique_idx
                    ON point_history (user_id, order_id)
                    WHERE order_id IS NOT NULL AND is_deleted = false
                    """);
        });
    }
}
