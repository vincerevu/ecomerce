package com.project.ecommerce.modules.payment.config;

import com.project.ecommerce.modules.payment.enums.PaymentProvider;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
@RequiredArgsConstructor
public class PaymentSchemaSyncConfig {

    private static final List<String> PAYMENT_STATUSES = List.of(
            "UNPAID",
            "PENDING",
            "PARTIALLY_PAID",
            "PAID",
            "FAILED",
            "REFUNDED");

    private static final List<String> PAYMENT_PROVIDERS = List.of(PaymentProvider.values()).stream()
            .map(Enum::name)
            .toList();

    private final TransactionTemplate transactionTemplate;

    @Bean
    @org.springframework.core.annotation.Order(250)
    ApplicationRunner paymentSchemaSyncRunner(JdbcTemplate jdbcTemplate) {
        return args -> transactionTemplate.executeWithoutResult(status -> {
            syncCheckConstraint(
                    jdbcTemplate,
                    "orders",
                    "orders_payment_status_check",
                    "payment_status");
            syncCheckConstraint(
                    jdbcTemplate,
                    "payment_transactions",
                    "payment_transactions_status_check",
                    "status");
            syncCheckConstraint(
                    jdbcTemplate,
                    "payment_transactions",
                    "payment_transactions_provider_check",
                    "provider",
                    PAYMENT_PROVIDERS);
        });
    }

    private void syncCheckConstraint(
            JdbcTemplate jdbcTemplate,
            String tableName,
            String constraintName,
            String columnName) {
        syncCheckConstraint(jdbcTemplate, tableName, constraintName, columnName, PAYMENT_STATUSES);
    }

    private void syncCheckConstraint(
            JdbcTemplate jdbcTemplate,
            String tableName,
            String constraintName,
            String columnName,
            List<String> allowedValues) {
        jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP CONSTRAINT IF EXISTS " + constraintName);
        jdbcTemplate.execute(
                "ALTER TABLE " + tableName
                        + " ADD CONSTRAINT " + constraintName
                        + " CHECK (" + columnName + " IN ("
                        + String.join(", ", allowedValues.stream().map(value -> "'" + value + "'").toList())
                        + "))");
    }
}
