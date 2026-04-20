package com.project.ecommerce.modules.identity.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.request.CreateUserRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateUserProfileRequest;
import com.project.ecommerce.modules.identity.dto.response.UserResponse;
import com.project.ecommerce.modules.identity.entity.Role;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.order.enums.OrderStatus;
import com.project.ecommerce.modules.order.repository.OrderRepository;

import com.project.ecommerce.modules.identity.mapper.UserMapper;
import com.project.ecommerce.modules.identity.repository.RoleRepository;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.project.ecommerce.modules.identity.enums.RoleEnum;
import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.common.dto.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    OrderRepository orderRepository;

    public UserResponse getUserByPhone(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toResponse(user);
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    public PageResponse<UserResponse> getUsers(Specification<User> spec, Pageable pageable) {
        Page<User> userPage = userRepository.findAll(spec, pageable);

        return PageResponse.<UserResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .last(userPage.isLast())
                .data(userPage.getContent().stream().map(userMapper::toResponse).toList())
                .build();
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    public PageResponse<UserResponse> getStaff(Specification<User> spec, Pageable pageable) {
        Specification<User> staffSpec = (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("type"),
                UserType.EMPLOYEE);

        Specification<User> finalSpec = spec == null ? staffSpec : spec.and(staffSpec);

        Page<User> userPage = userRepository.findAll(finalSpec, pageable);

        return PageResponse.<UserResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .last(userPage.isLast())
                .data(userPage.getContent().stream().map(userMapper::toResponse).toList())
                .build();
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    public PageResponse<UserResponse> getCustomers(Specification<User> spec, Pageable pageable) {
        Specification<User> customerSpec = (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("type"),
                UserType.CUSTOMER);

        Specification<User> finalSpec = spec == null ? customerSpec : spec.and(customerSpec);
        Page<User> userPage = userRepository.findAll(finalSpec, pageable);

        return PageResponse.<UserResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .last(userPage.isLast())
                .data(userPage.getContent().stream().map(userMapper::toResponse).toList())
                .build();
    }

    @PreAuthorize("hasAuthority('USER:CREATE')")
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByPhone(request.getPhone()))
            throw new AppException(ErrorCode.USER_EXISTED);

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            roles = new HashSet<>(roleRepository.findByNameInAndIsDeletedFalse(request.getRoles()));
            user.setRoles(roles);

            // Kiểm tra xem có staff role không để set type
            boolean hasStaffRole = roles.stream()
                    .anyMatch(role -> !role.getName().equals(RoleEnum.USER.name()));
            if (hasStaffRole) {
                user.setType(UserType.EMPLOYEE);
            }
        } else {
            roleRepository.findByNameAndIsDeletedFalse(RoleEnum.USER.name()).ifPresent(roles::add);
            user.setRoles(roles);
            user.setType(UserType.CUSTOMER);
        }

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    public UserResponse getUserByid(String id) {
        User user = userRepository.getUserById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        syncTotalSpent(user);
        return userMapper.toResponse(user);
    }

    public UserResponse updateProfile(String userId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getPhone() != null && !request.getPhone().isEmpty()
                && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(request.getPhone()))
                throw new AppException(ErrorCode.USER_EXISTED);
            user.setPhone(request.getPhone());
        }

        userMapper.updateProfile(user, request);

        return userMapper.toResponse(userRepository.save(user));
    }

    @PreAuthorize("hasAuthority('USER:UPDATE')")
    public UserResponse updateUser(String userId, CreateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getPhone() != null && !request.getPhone().isEmpty()
                && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(request.getPhone()))
                throw new AppException(ErrorCode.USER_EXISTED);
            user.setPhone(request.getPhone());
        }

        userMapper.updateUser(user, request);

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            var roles = new java.util.HashSet<>(roleRepository.findByNameInAndIsDeletedFalse(request.getRoles()));
            user.setRoles(roles);

            // Cập nhật type dựa trên role
            boolean hasStaffRole = roles.stream()
                    .anyMatch(role -> !role.getName().equals(RoleEnum.USER.name()));
            user.setType(hasStaffRole ? UserType.EMPLOYEE : UserType.CUSTOMER);
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @PreAuthorize("hasAuthority('USER:DELETE')")
    @Transactional
    public void deleteUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setIsDeleted(true);
        userRepository.save(user);
    }

    @PreAuthorize("hasAuthority('USER:UPDATE')")
    public UserResponse updateUserActiveStatus(String userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(active);
        return userMapper.toResponse(userRepository.save(user));
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    public java.util.Set<String> getAllStaffPositions() {
        return new java.util.HashSet<>(userRepository.findDistinctPositions());
    }

    private void syncTotalSpent(User user) {
        if (user.getId() == null) {
            return;
        }

        java.math.BigDecimal actualTotalSpent =
                orderRepository.sumTotalAmountByUserIdAndStatus(user.getId(), OrderStatus.DELIVERED);
        java.math.BigDecimal currentTotalSpent =
                user.getTotalSpent() != null ? user.getTotalSpent() : java.math.BigDecimal.ZERO;

        if (currentTotalSpent.compareTo(actualTotalSpent) != 0) {
            user.setTotalSpent(actualTotalSpent);
            userRepository.save(user);
        }
    }

}
