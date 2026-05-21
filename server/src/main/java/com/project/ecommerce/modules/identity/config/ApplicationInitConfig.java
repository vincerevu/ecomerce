package com.project.ecommerce.modules.identity.config;

import com.project.ecommerce.modules.identity.entity.Permission;
import com.project.ecommerce.modules.identity.entity.Role;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.RoleEnum;
import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import com.project.ecommerce.modules.identity.repository.PermissionRepository;
import com.project.ecommerce.modules.identity.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class ApplicationInitConfig {

    private final PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(RoleRepository roleRepository, UserRepository userRepository,
            PermissionRepository permissionRepository) {
        return args -> {
            // 1. Initialize Permissions
            String[] commonActions = { "VIEW", "CREATE", "UPDATE", "DELETE" };
            String[] resources = { "USER", "ROLE", "PERMISSION", "PRODUCT", "COLLECTION", "CATEGORY", "TAG", "ORDER", "PAYMENT", "REPORT",
                    "MEMBERSHIP_TIER", "INVENTORY", "SHIPMENT", "COUPON", "REVIEW" };

            for (String resource : resources) {
                for (String action : commonActions) {
                    String permissionName = resource + ":" + action;
                    if (!permissionRepository.existsById(permissionName)) {
                        permissionRepository.save(Permission.builder()
                                .name(permissionName)
                                .description("Quyền " + action.toLowerCase() + " " + resource.toLowerCase())
                                .build());
                    }
                }
            }

            var activePermissions = permissionRepository.findAllByIsDeletedFalse();

            // 2. Initialize and synchronize Roles from RoleEnum
            for (RoleEnum roleEnum : RoleEnum.values()) {
                log.info("Ensuring role permissions: {}", roleEnum.name());
                Set<Permission> rolePermissions = new HashSet<>();

                if (roleEnum == RoleEnum.ADMIN) {
                    rolePermissions.addAll(activePermissions);
                } else if (roleEnum == RoleEnum.MANAGER) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().endsWith(":VIEW") || p.getName().startsWith("PRODUCT:")
                                    || p.getName().startsWith("COLLECTION:")
                                    || p.getName().startsWith("CATEGORY:") || p.getName().startsWith("TAG:")
                                    || p.getName().startsWith("ORDER:") || p.getName().startsWith("PAYMENT:")
                                    || p.getName().startsWith("REPORT:")
                                    || p.getName().startsWith("INVENTORY:")
                                    || p.getName().startsWith("SHIPMENT:")
                                    || p.getName().startsWith("USER:"))
                            .collect(Collectors.toSet()));
                } else if (roleEnum == RoleEnum.OPERATOR) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().startsWith("ORDER:") || p.getName().startsWith("PRODUCT:VIEW"))
                            .collect(Collectors.toSet()));
                } else if (roleEnum == RoleEnum.SALES) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().startsWith("ORDER:CREATE")
                                    || p.getName().startsWith("ORDER:UPDATE")
                                    || p.getName().startsWith("ORDER:VIEW")
                                    || p.getName().startsWith("PAYMENT:VIEW")
                                    || p.getName().startsWith("SHIPMENT:VIEW")
                                    || p.getName().equals("PRODUCT:VIEW")
                                    || p.getName().equals("COLLECTION:VIEW"))
                            .collect(Collectors.toSet()));
                } else if (roleEnum == RoleEnum.INVENTORY) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().startsWith("PRODUCT:")
                                    || p.getName().startsWith("COLLECTION:")
                                    || p.getName().startsWith("CATEGORY:")
                                    || p.getName().startsWith("TAG:")
                                    || p.getName().startsWith("INVENTORY:")
                                    || p.getName().startsWith("SHIPMENT:VIEW")
                                    || p.getName().startsWith("ORDER:VIEW"))
                            .collect(Collectors.toSet()));
                } else if (roleEnum == RoleEnum.SUPPORT) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().equals("USER:VIEW") || p.getName().startsWith("ORDER:VIEW"))
                            .collect(Collectors.toSet()));
                } else if (roleEnum == RoleEnum.ACCOUNTANT) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().startsWith("REPORT:VIEW")
                                    || p.getName().startsWith("ORDER:VIEW")
                                    || p.getName().startsWith("PAYMENT:"))
                            .collect(Collectors.toSet()));
                } else if (roleEnum == RoleEnum.EMPLOYEE) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().equals("PRODUCT:VIEW")
                                    || p.getName().equals("COLLECTION:VIEW")
                                    || p.getName().equals("CATEGORY:VIEW")
                                    || p.getName().equals("TAG:VIEW"))
                            .collect(Collectors.toSet()));
                } else if (roleEnum == RoleEnum.USER) {
                    rolePermissions.addAll(activePermissions.stream()
                            .filter(p -> p.getName().endsWith(":VIEW")
                                    && !p.getName().startsWith("REPORT:")
                                    && !p.getName().startsWith("ROLE:")
                                    && !p.getName().startsWith("PERMISSION:")
                                    && !p.getName().startsWith("USER:"))
                            .collect(Collectors.toSet()));
                }

                Role role = roleRepository.findById(roleEnum.name())
                        .map(existingRole -> {
                            existingRole.setIsDeleted(false);
                            existingRole.setDescription(roleEnum.getDisplayName());
                            existingRole.setPermissions(rolePermissions);
                            return existingRole;
                        })
                        .orElseGet(() -> Role.builder()
                                .name(roleEnum.name())
                                .description(roleEnum.getDisplayName())
                                .permissions(rolePermissions)
                                .build());

                roleRepository.save(role);
            }

            // 3. Ensure default backoffice accounts always exist
            log.info("Ensuring default staff accounts...");

            Role adminRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.ADMIN.name()).orElse(null);
            Role employeeRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.EMPLOYEE.name()).orElse(null);
            Role managerRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.MANAGER.name()).orElse(null);

            if (adminRole != null && !userRepository.existsByPhone("0900000001")) {
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                if (employeeRole != null) {
                    roles.add(employeeRole);
                }
                User admin = User.builder()
                        .phone("0900000001")
                        .password(passwordEncoder.encode("admin123"))
                        .name("H? th?ng Admin")
                        .email("admin@ecommerce.com")
                        .position("Qu?n tr? h? th?ng")
                        .active(true)
                        .type(UserType.EMPLOYEE)
                        .roles(roles)
                        .build();
                userRepository.save(admin);
            }

            if (managerRole != null && !userRepository.existsByPhone("0900000002")) {
                Set<Role> roles = new HashSet<>();
                roles.add(managerRole);
                if (employeeRole != null) {
                    roles.add(employeeRole);
                }
                User manager = User.builder()
                        .phone("0900000002")
                        .password(passwordEncoder.encode("admin123"))
                        .name("Nguy?n Th? Huynh")
                        .email("manager@ecommerce.com")
                        .position("Qu?n l?")
                        .active(true)
                        .type(UserType.EMPLOYEE)
                        .roles(roles)
                        .build();
                userRepository.save(manager);
            }

            Role userRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.USER.name()).orElse(null);
            if (userRole != null && !userRepository.existsByPhone("0987654321")) {
                Set<Role> roles = new HashSet<>();
                roles.add(userRole);
                User customer = User.builder()
                        .phone("0987654321")
                        .password(passwordEncoder.encode("user123"))
                        .name("Kh?ch h?ng Test")
                        .email("user@gmail.com")
                        .active(true)
                        .type(UserType.CUSTOMER)
                        .roles(roles)
                        .build();
                userRepository.save(customer);
            }

            if (userRepository.count() == 0) {
                // 4. Seed 20 additional staff
                log.info("Seeding 20 additional staff members...");
                Role salesRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.SALES.name()).orElse(null);
                Role inventoryRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.INVENTORY.name()).orElse(null);
                Role supportRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.SUPPORT.name()).orElse(null);
                Role operatorRole = roleRepository.findByNameAndIsDeletedFalse(RoleEnum.OPERATOR.name()).orElse(null);

                String[] names = { "Lê Văn A", "Trần Thị B", "Nguyễn Văn C", "Phạm Thị D", "Hoàng Văn E", "Vũ Thị F",
                        "Phan Văn G", "Đỗ Thị H", "Bùi Văn I", "Lý Thị K", "Đặng Văn L", "Ngô Thị M", "Dương Văn N",
                        "Trịnh Thị P", "Trương Văn Q", "Lương Thị R", "Đinh Văn S", "Hà Thị T", "Chu Văn U",
                        "Võ Thị V" };
                String[] posList = { "Bán hàng", "Kho", "Hỗ trợ", "Vận hành" };
                Role[] roleMapping = { salesRole, inventoryRole, supportRole, operatorRole };

                for (int i = 0; i < 20; i++) {
                    String phone = String.format("0912345%03d", i + 1);
                    Set<Role> roles = new HashSet<>();
                    if (employeeRole != null)
                        roles.add(employeeRole);

                    Role specializedRole = roleMapping[i % roleMapping.length];
                    if (specializedRole != null)
                        roles.add(specializedRole);

                    User staff = User.builder()
                            .phone(phone)
                            .password(passwordEncoder.encode("staff123"))
                            .name(names[i % names.length])
                            .email("staff" + (i + 1) + "@ecommerce.com")
                            .position(posList[i % posList.length])
                            .active(true)
                            .type(UserType.EMPLOYEE)
                            .roles(roles)
                            .build();
                    userRepository.save(staff);
                }
                log.info("20 additional staff members seeded.");
            }
        };
    }
}
