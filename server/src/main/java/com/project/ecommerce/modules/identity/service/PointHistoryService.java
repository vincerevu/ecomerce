package com.project.ecommerce.modules.identity.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.response.PointHistoryResponse;
import com.project.ecommerce.modules.identity.entity.PointHistory;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.mapper.PointHistoryMapper;
import com.project.ecommerce.modules.identity.repository.PointHistoryRepository;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PointHistoryService {
    PointHistoryRepository pointHistoryRepository;
    UserRepository userRepository;
    PointHistoryMapper pointHistoryMapper;

    @PreAuthorize("isAuthenticated()")
    public List<PointHistoryResponse> getUserPointHistory(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        return pointHistoryRepository.findByUserId(userId)
                .stream()
                .map(pointHistoryMapper::toResponse)
                .toList();
    }

    public boolean hasAwardedPointsForOrder(String userId, String orderId) {
        return pointHistoryRepository.existsByUserIdAndOrderId(userId, orderId);
    }

    @Transactional
    public void addPointsToUser(String userId, Integer points, String reason, String orderId) {
        if (orderId != null && pointHistoryRepository.existsByUserIdAndOrderId(userId, orderId)) {
            return;
        }

        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (orderId != null && pointHistoryRepository.existsByUserIdAndOrderId(userId, orderId)) {
            return;
        }

        int currentPoints = user.getTotalPoints() == null ? 0 : user.getTotalPoints();
        int pointsToAdd = points == null ? 0 : points;

        // Update user total points
        user.setTotalPoints(currentPoints + pointsToAdd);
        userRepository.save(user);

        // Record point history
        PointHistory history = PointHistory.builder()
                .user(user)
                .points(pointsToAdd)
                .reason(reason)
                .orderId(orderId)
                .build();
        pointHistoryRepository.save(history);
    }

    @Transactional
    public void deductPointsFromUser(String userId, Integer points, String reason) {
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        int currentPoints = user.getTotalPoints() == null ? 0 : user.getTotalPoints();
        int pointsToDeduct = points == null ? 0 : points;

        if (currentPoints < pointsToDeduct) {
            throw new AppException(ErrorCode.INSUFFICIENT_POINTS);
        }

        // Update user total points
        user.setTotalPoints(currentPoints - pointsToDeduct);
        userRepository.save(user);

        // Record point history
        PointHistory history = PointHistory.builder()
                .user(user)
                .points(-pointsToDeduct)
                .reason(reason)
                .build();
        pointHistoryRepository.save(history);
    }
}
