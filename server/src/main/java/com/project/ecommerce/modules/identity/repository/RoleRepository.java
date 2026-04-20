package com.project.ecommerce.modules.identity.repository;

import com.project.ecommerce.modules.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role,String> {
    List<Role> findAllByIsDeletedFalse();

    Optional<Role> findByNameAndIsDeletedFalse(String name);

    boolean existsByNameAndIsDeletedFalse(String name);

    Set<Role> findByNameInAndIsDeletedFalse(Set<String> names);
}
