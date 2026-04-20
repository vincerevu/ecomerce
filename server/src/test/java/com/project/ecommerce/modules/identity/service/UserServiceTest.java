package com.project.ecommerce.modules.identity.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.response.MembershipTierResponse;
import com.project.ecommerce.modules.identity.dto.request.CreateUserRequest;
import com.project.ecommerce.modules.identity.dto.response.UserResponse;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.Gender;
import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.modules.identity.mapper.UserMapper;
import com.project.ecommerce.modules.identity.repository.RoleRepository;
import com.project.ecommerce.modules.identity.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private CreateUserRequest createUserRequest;
    private User user;
    private UserResponse userResponse;

    @BeforeEach
    void initData() {
        createUserRequest = CreateUserRequest.builder()
                .phone("0123456789")
                .name("Test User")
                .password("password123")
                .gender(Gender.MALE)
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .build();

        user = User.builder()
                .id("some-uuid")
                .phone("0123456789")
                .name("Test User")
                .build();

        userResponse = new UserResponse();
        userResponse.setId("some-uuid");
        userResponse.setPhone("0123456789");
        userResponse.setName("Test User");
        userResponse.setType("CUSTOMER");
        userResponse.setActive(true);
        userResponse.setTotalPoints(100);
        userResponse.setMembershipTier(new MembershipTierResponse("tier-1", "Gold", null, null, null));
    }

    @Test
    void createUser_ValidRequest_Success() {
        // GIVEN
        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(userMapper.toUser(any())).thenReturn(user);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(userRepository.save(any())).thenReturn(user);
        when(userMapper.toResponse(any())).thenReturn(userResponse);

        // WHEN
        var result = userService.createUser(createUserRequest);

        // THEN
        assertThat(result.getPhone()).isEqualTo("0123456789");
        assertThat(result.getId()).isEqualTo("some-uuid");

        verify(userRepository).existsByPhone(anyString());
        verify(userRepository).save(any());
    }

    @Test
    void createUser_UserExisted_Fail() {
        // GIVEN
        when(userRepository.existsByPhone(anyString())).thenReturn(true);

        // WHEN & THEN
        assertThatThrownBy(() -> userService.createUser(createUserRequest))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_EXISTED);

        verify(userRepository, never()).save(any());
    }

    @Test
    void getUserByPhone_Success() {
        // GIVEN
        when(userRepository.findByPhone(anyString())).thenReturn(Optional.of(user));
        when(userMapper.toResponse(any())).thenReturn(userResponse);

        // WHEN
        var result = userService.getUserByPhone("0123456789");

        // THEN
        assertThat(result.getPhone()).isEqualTo("0123456789");
        verify(userRepository).findByPhone("0123456789");
    }

    @Test
    void getUserByPhone_NotFound_Fail() {
        // GIVEN
        when(userRepository.findByPhone(anyString())).thenReturn(Optional.empty());

        // WHEN & THEN
        assertThatThrownBy(() -> userService.getUserByPhone("0123456789"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_EXISTED);
    }

    @Test
    void getCustomers_ShouldReturnOnlyCustomersPage() {
        // GIVEN
        user.setType(UserType.CUSTOMER);
        when(userRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1));
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        // WHEN
        var result = userService.getCustomers(null, PageRequest.of(0, 10));

        // THEN
        assertThat(result.getData()).hasSize(1);
        assertThat(result.getData().getFirst().getName()).isEqualTo("Test User");
    }

    @Test
    void updateUserActiveStatus_ShouldPersistNewStatus() {
        // GIVEN
        when(userRepository.findById("some-uuid")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userMapper.toResponse(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            UserResponse response = new UserResponse();
            response.setId(savedUser.getId());
            response.setActive(savedUser.isActive());
            return response;
        });

        // WHEN
        var result = userService.updateUserActiveStatus("some-uuid", false);

        // THEN
        assertThat(result.isActive()).isFalse();
        verify(userRepository).save(user);
    }

    @Test
    void deleteUser_ShouldSoftDeleteUser() {
        // GIVEN
        when(userRepository.findById("some-uuid")).thenReturn(Optional.of(user));

        // WHEN
        userService.deleteUser("some-uuid");

        // THEN
        assertThat(user.getIsDeleted()).isTrue();
        verify(userRepository).save(user);
    }
}
