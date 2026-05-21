package com.project.ecommerce.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@Slf4j
public class R2Config {

    private static final Pattern R2_ENDPOINT_PATTERN = Pattern.compile("https?://([^.]+)\\.r2\\.cloudflarestorage\\.com.*");

    @Value("${app.r2.account-id}")
    private String accountId;

    @Value("${app.r2.access-key}")
    private String accessKey;

    @Value("${app.r2.secret-key}")
    private String secretKey;

    @Bean
    public S3Client s3Client() {
        validateConfig();
        URI endpoint = r2Endpoint();
        return S3Client.builder()
                .endpointOverride(endpoint)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        validateConfig();
        URI endpoint = r2Endpoint();
        return S3Presigner.builder()
                .endpointOverride(endpoint)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.US_EAST_1)
                .serviceConfiguration(
                        software.amazon.awssdk.services.s3.S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                .build();
    }

    private URI r2Endpoint() {
        String normalizedAccountId = normalizeAccountId(accountId);
        return URI.create(String.format("https://%s.r2.cloudflarestorage.com", normalizedAccountId));
    }

    private String normalizeAccountId(String value) {
        String normalized = value.trim();
        if (normalized.startsWith("R2_ACCOUNT_ID=")) {
            normalized = normalized.substring("R2_ACCOUNT_ID=".length()).trim();
        }

        Matcher endpointMatcher = R2_ENDPOINT_PATTERN.matcher(normalized);
        if (endpointMatcher.matches()) {
            normalized = endpointMatcher.group(1);
        }

        if (!normalized.matches("[a-zA-Z0-9]+")) {
            throw new IllegalStateException("R2_ACCOUNT_ID must be the Cloudflare account id only, not a full endpoint URL.");
        }

        return normalized;
    }

    private void validateConfig() {
        if (!StringUtils.hasText(accountId) || !StringUtils.hasText(accessKey) || !StringUtils.hasText(secretKey)) {
            log.error("R2 configuration is incomplete. Please check your environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY)");
            throw new IllegalStateException("R2 configuration is incomplete. Make sure R2_ACCOUNT_ID, R2_ACCESS_KEY, and R2_SECRET_KEY are set.");
        }
    }
}
