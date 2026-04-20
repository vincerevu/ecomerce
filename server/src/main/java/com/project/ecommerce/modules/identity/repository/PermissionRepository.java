package com.project.ecommerce.modules.identity.repository;

import com.project.ecommerce.modules.identity.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {
    Optional<Permission> findByName(String name);

    Set<Permission> findByNameIn(Set<String> names);

    List<Permission> findAllByIsDeletedFalse();

    Optional<Permission> findByNameAndIsDeletedFalse(String name);

    Set<Permission> findByNameInAndIsDeletedFalse(Set<String> names);

    boolean existsByNameAndIsDeletedFalse(String name);
}
