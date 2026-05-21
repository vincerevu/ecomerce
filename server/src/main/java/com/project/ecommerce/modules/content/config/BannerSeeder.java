package com.project.ecommerce.modules.content.config;

import com.project.ecommerce.modules.content.entity.Banner;
import com.project.ecommerce.modules.content.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BannerSeeder implements CommandLineRunner {

    private final BannerRepository bannerRepository;

    @Override
    public void run(String... args) throws Exception {
        if (bannerRepository.count() == 0) {
            log.info("Seeding default banners...");

            Banner banner1 = Banner.builder()
                    .title("Giao Mùa Săn Sale Sốc")
                    .imageUrl("https://buggy.yodycdn.com/images/home-banner-dt/302f3af8f6f60337fad1847bb42a48df.webp?width=2880&height=900")
                    .linkUrl("https://yody.vn/collection/bst-cooler-closer")
                    .position("HOME_MAIN")
                    .priority(10)
                    .active(true)
                    .startDate(LocalDateTime.now())
                    .build();

            Banner banner2 = Banner.builder()
                    .title("Đồ Thể Thao Bán Chạy 2026")
                    .imageUrl("https://buggy.yodycdn.com/images/home-banner-dt/0d3c5337aa48c9cc528db2f7229d64fc.webp?width=2880&height=900")
                    .linkUrl("https://yody.vn/collection/do-the-thao-ban-chay-2026")
                    .position("HOME_MAIN")
                    .priority(5)
                    .active(true)
                    .startDate(LocalDateTime.now())
                    .build();

            bannerRepository.saveAll(List.of(banner1, banner2));
            log.info("Successfully seeded 2 banners.");
        } else {
            log.info("Banners already exist, skipping seeding.");
        }
    }
}
