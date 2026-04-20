package com.project.ecommerce.modules.identity.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.request.CreateRoleRequest;
import com.project.ecommerce.modules.identity.dto.response.RoleResponse;
import com.project.ecommerce.modules.identity.entity.Role;
import com.project.ecommerce.modules.identity.entity.Permission;
import com.project.ecommerce.modules.identity.mapper.RoleMapper;
import com.project.ecommerce.modules.identity.repository.RoleRepository;
import com.project.ecommerce.modules.identity.repository.PermissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.List;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    @PreAuthorize("hasAuthority('ROLE:CREATE')")
    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.existsByNameAndIsDeletedFalse(request.getName())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        Role role = roleRepository.findById(request.getName())
                .map(existingRole -> {
                    existingRole.setIsDeleted(false);
                    existingRole.setDescription(request.getDescription());
                    return existingRole;
                })
                .orElseGet(() -> roleMapper.toRole(request));

        // Assign permissions if provided
        if (!CollectionUtils.isEmpty(request.getPermissionNames())) {
            var permissions = permissionRepository.findByNameInAndIsDeletedFalse(request.getPermissionNames());
            role.setPermissions(permissions);
        }

        return roleMapper.toResponse(roleRepository.save(role));
    }

    @PreAuthorize("hasAuthority('ROLE:VIEW')")
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAllByIsDeletedFalse()
                .stream()
                .map(roleMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasAuthority('ROLE:VIEW')")
    public RoleResponse getRoleById(String name) {
        Role role = roleRepository.findByNameAndIsDeletedFalse(name)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return roleMapper.toResponse(role);
    }

    @PreAuthorize("hasAuthority('ROLE:UPDATE')")
    @Transactional
    public RoleResponse updateRole(String name, CreateRoleRequest request) {
        Role role = roleRepository.findByNameAndIsDeletedFalse(name)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        role.setDescription(request.getDescription());

        if (CollectionUtils.isEmpty(request.getPermissionNames())) {
            role.setPermissions(new HashSet<>());
        } else {
            role.setPermissions(new HashSet<>(permissionRepository.findByNameInAndIsDeletedFalse(request.getPermissionNames())));
        }

        return roleMapper.toResponse(roleRepository.save(role));
    }

    @PreAuthorize("hasAuthority('ROLE:DELETE')")
    @Transactional
    public void deleteRole(String name) {
        Role role = roleRepository.findByNameAndIsDeletedFalse(name)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        role.setIsDeleted(true);
        roleRepository.save(role);
    }
}
