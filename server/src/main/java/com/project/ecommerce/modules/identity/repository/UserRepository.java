package com.project.ecommerce.modules.identity.repository;

import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.UserType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    Optional<User> findByPhone(String phone);

    @Query("""
            select distinct u
            from User u
            left join fetch u.roles r
            left join fetch r.permissions
            where u.phone = :phone
            """)
    Optional<User> findByPhoneWithRoles(@Param("phone") String phone);

    boolean existsByPhone(String phone);

    Optional<User> findByEmail(String email);

    @Query("""
            select distinct u
            from User u
            left join fetch u.roles r
            left join fetch r.permissions
            where u.email = :email
            """)
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("""
            select distinct u
            from User u
            left join fetch u.roles r
            left join fetch r.permissions
            where u.id = :id
            """)
    Optional<User> findByIdWithRoles(@Param("id") String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select u
            from User u
            where u.id = :id
            """)
    Optional<User> findByIdForUpdate(@Param("id") String id);

    boolean existsByEmail(String email);

    Optional<User> getUserById(String id);

    Page<User> findByType(UserType type, Pageable pageable);

    long countByType(UserType type);
    long countByTypeAndActiveTrue(UserType type);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u.position FROM User u WHERE u.type = 'EMPLOYEE' AND u.position IS NOT NULL")
    java.util.List<String> findDistinctPositions();
}
