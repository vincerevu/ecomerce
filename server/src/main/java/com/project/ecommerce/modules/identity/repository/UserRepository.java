package com.project.ecommerce.modules.identity.repository;

import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.UserType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> getUserById(String id);

    Page<User> findByType(UserType type, Pageable pageable);

    long countByType(UserType type);
    long countByTypeAndActiveTrue(UserType type);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.position FROM User u WHERE u.type = 'EMPLOYEE' AND u.position IS NOT NULL")
    java.util.List<String> findDistinctPositions();
}
