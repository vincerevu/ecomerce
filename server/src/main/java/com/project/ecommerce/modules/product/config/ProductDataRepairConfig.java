package com.project.ecommerce.modules.product.config;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductDataRepairConfig {

    private final EntityManager entityManager;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void repairSoftDeleteFlags() {
        int repairedVariants = entityManager
                .createNativeQuery("update product_variants set is_deleted = false where is_deleted is null")
                .executeUpdate();
        int repairedImages = entityManager
                .createNativeQuery("update product_images set is_deleted = false where is_deleted is null")
                .executeUpdate();

        if (repairedVariants > 0 || repairedImages > 0) {
            log.info("Repaired soft-delete flags for {} variants and {} images", repairedVariants, repairedImages);
        }
    }
}
