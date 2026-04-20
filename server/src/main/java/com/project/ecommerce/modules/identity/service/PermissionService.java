package com.project.ecommerce.modules.identity.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.request.CreatePermissionRequest;
import com.project.ecommerce.modules.identity.dto.response.PermissionResponse;
import com.project.ecommerce.modules.identity.entity.Permission;
import com.project.ecommerce.modules.identity.mapper.PermissionMapper;
import com.project.ecommerce.modules.identity.repository.PermissionRepository;
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
public class PermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    @PreAuthorize("hasAuthority('PERMISSION:CREATE')")
    @Transactional
    public PermissionResponse createPermission(CreatePermissionRequest request) {
        if (permissionRepository.existsByNameAndIsDeletedFalse(request.getName())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        Permission permission = permissionRepository.findByName(request.getName())
                .map(existingPermission -> {
                    existingPermission.setIsDeleted(false);
                    existingPermission.setDescription(request.getDescription());
                    return existingPermission;
                })
                .orElseGet(() -> permissionMapper.toPermission(request));
        return permissionMapper.toResponse(permissionRepository.save(permission));
    }

    @PreAuthorize("hasAuthority('PERMISSION:VIEW')")
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAllByIsDeletedFalse()
                .stream()
                .map(permissionMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasAuthority('PERMISSION:VIEW')")
    public PermissionResponse getPermissionById(String id) {
        Permission permission = permissionRepository.findByNameAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return permissionMapper.toResponse(permission);
    }

    @PreAuthorize("hasAuthority('PERMISSION:DELETE')")
    @Transactional
    public void deletePermission(String id) {
        Permission permission = permissionRepository.findByNameAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        permission.setIsDeleted(true);
        permissionRepository.save(permission);
    }
}
