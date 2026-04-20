package com.project.ecommerce.modules.product.config;

import com.project.ecommerce.modules.product.service.YodyImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.import.yody", name = "enabled", havingValue = "true")
@Slf4j
public class YodyImportRunner implements ApplicationRunner {
    private final YodyImportService yodyImportService;
    private final Environment environment;
    private final ConfigurableApplicationContext applicationContext;

    @Override
    public void run(ApplicationArguments args) {
        Integer limit = environment.getProperty("app.import.yody.limit", Integer.class);
        boolean skipExisting = environment.getProperty("app.import.yody.skip-existing", Boolean.class, true);
        boolean exitOnComplete = environment.getProperty("app.import.yody.exit-on-complete", Boolean.class, true);

        log.info("Starting Yody import with limit={} skipExisting={}", limit, skipExisting);
        var result = yodyImportService.importFromSitemap(limit, skipExisting);
        log.info(
                "Yody import completed: requested={}, created={}, updated={}, skipped={}, failed={}",
                result.totalRequested(),
                result.createdCount(),
                result.updatedCount(),
                result.skippedCount(),
                result.failedCount());

        if (exitOnComplete) {
            int exitCode = result.failedCount() > 0 ? 1 : 0;
            int springExitCode = org.springframework.boot.SpringApplication.exit(applicationContext, () -> exitCode);
            System.exit(springExitCode);
        }
    }
}
