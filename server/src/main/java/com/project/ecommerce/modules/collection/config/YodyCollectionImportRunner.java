package com.project.ecommerce.modules.collection.config;

import com.project.ecommerce.modules.collection.service.YodyCollectionImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class YodyCollectionImportRunner {
    private final YodyCollectionImportService yodyCollectionImportService;

    @Bean
    @ConditionalOnProperty(prefix = "app.import.yody.collections", name = "enabled", havingValue = "true")
    CommandLineRunner importYodyCollectionsRunner(
            org.springframework.core.env.Environment environment) {
        return args -> {
            Integer limit = environment.getProperty("app.import.yody.collections.limit", Integer.class);
            boolean exitOnComplete = environment.getProperty("app.import.yody.collections.exit-on-complete", Boolean.class, false);

            YodyCollectionImportService.YodyCollectionImportResult result =
                    yodyCollectionImportService.importCollections(limit);

            log.info(
                    "Yody collection import completed: total={}, created={}, updated={}, failed={}",
                    result.totalCollections(),
                    result.createdCount(),
                    result.updatedCount(),
                    result.failedCount());

            if (exitOnComplete) {
                System.exit(0);
            }
        };
    }
}
