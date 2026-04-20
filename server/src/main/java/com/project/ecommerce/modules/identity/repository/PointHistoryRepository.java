package com.project.ecommerce.modules.identity.repository;

import com.project.ecommerce.modules.identity.entity.PointHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, String>, JpaSpecificationExecutor<PointHistory> {
    List<PointHistory> findByUserId(String userId);
    boolean existsByUserIdAndOrderId(String userId, String orderId);
}
