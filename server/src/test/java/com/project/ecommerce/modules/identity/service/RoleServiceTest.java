package com.project.ecommerce.modules.identity.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.ecommerce.modules.identity.entity.Role;
import com.project.ecommerce.modules.identity.mapper.RoleMapper;
import com.project.ecommerce.modules.identity.repository.PermissionRepository;
import com.project.ecommerce.modules.identity.repository.RoleRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoleServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RoleMapper roleMapper;

    @InjectMocks
    private RoleService roleService;

    @Test
    void deleteRole_shouldSoftDeleteRole() {
        Role role = Role.builder()
                .name("MANAGER")
                .description("Manager")
                .isDeleted(false)
                .build();
        when(roleRepository.findByNameAndIsDeletedFalse("MANAGER")).thenReturn(Optional.of(role));

        roleService.deleteRole("MANAGER");

        assertThat(role.getIsDeleted()).isTrue();
        verify(roleRepository).save(role);
    }
}
