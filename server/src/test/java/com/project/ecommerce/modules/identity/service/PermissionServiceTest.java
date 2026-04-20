package com.project.ecommerce.modules.identity.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.ecommerce.modules.identity.entity.Permission;
import com.project.ecommerce.modules.identity.mapper.PermissionMapper;
import com.project.ecommerce.modules.identity.repository.PermissionRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private PermissionMapper permissionMapper;

    @InjectMocks
    private PermissionService permissionService;

    @Test
    void deletePermission_shouldSoftDeletePermission() {
        Permission permission = Permission.builder()
                .name("PRODUCT:VIEW")
                .description("View product")
                .isDeleted(false)
                .build();
        when(permissionRepository.findByNameAndIsDeletedFalse("PRODUCT:VIEW")).thenReturn(Optional.of(permission));

        permissionService.deletePermission("PRODUCT:VIEW");

        assertThat(permission.getIsDeleted()).isTrue();
        verify(permissionRepository).save(permission);
    }
}
