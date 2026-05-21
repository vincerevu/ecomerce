package com.project.ecommerce.modules.marketing.repository;

import com.project.ecommerce.modules.marketing.entity.Coupon;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, String>, JpaSpecificationExecutor<Coupon> {
    Optional<Coupon> findByCodeIgnoreCase(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select c
            from Coupon c
            where upper(c.code) = upper(:code)
            """)
    Optional<Coupon> findByCodeIgnoreCaseForUpdate(@Param("code") String code);

    List<Coupon> findTop20ByActiveTrueOrderByCreatedAtDesc();
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, String id);
}
