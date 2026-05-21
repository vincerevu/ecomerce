package com.project.ecommerce.modules.content.repository;

import com.project.ecommerce.modules.content.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, String>, JpaSpecificationExecutor<Banner> {
    
    @Query("SELECT b FROM Banner b WHERE b.active = true " +
           "AND (b.startDate IS NULL OR b.startDate <= :now) " +
           "AND (b.endDate IS NULL OR b.endDate >= :now) " +
           "ORDER BY b.priority DESC")
    List<Banner> findActiveBanners(LocalDateTime now);

    List<Banner> findByPositionAndActiveTrueOrderByPriorityDesc(String position);
}
