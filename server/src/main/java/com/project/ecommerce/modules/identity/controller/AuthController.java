package com.project.ecommerce.modules.identity.controller;

import com.nimbusds.jose.JOSEException;
import com.project.ecommerce.modules.identity.dto.request.*;
import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.modules.identity.dto.response.LoginResponse;
import com.project.ecommerce.modules.identity.dto.response.PhoneLookupResponse;
import com.project.ecommerce.modules.identity.dto.response.RefreshResponse;
import com.project.ecommerce.modules.identity.dto.response.IntrospectResponse;
import com.project.ecommerce.modules.identity.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.project.ecommerce.modules.identity.dto.response.UserResponse;
import jakarta.validation.Valid;

import java.text.ParseException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication Controller", description = "APIs for authentication")
public class AuthController {

        private final AuthenticationService authenticationService;

        @Operation(summary = "Login", description = "Authenticate user and return token")
        @PostMapping("/login")
        public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
                LoginResponse loginResponse = authenticationService.login(request);
                return ApiResponse.<LoginResponse>builder()
                                .code(1000)
                                .message("Login successful")
                                .result(loginResponse)
                                .build();
        }

        @Operation(summary = "Admin Login", description = "Authenticate admin/staff and return token")
        @PostMapping("/admin/login")
        public ApiResponse<LoginResponse> loginAdmin(@RequestBody LoginRequest request) {
                LoginResponse loginResponse = authenticationService.login(request);
                return ApiResponse.<LoginResponse>builder()
                                .code(1000)
                                .message("Admin login successful")
                                .result(loginResponse)
                                .build();
        }

        @Operation(summary = "Refresh Token", description = "Refresh access token using refresh token")
        @PostMapping("/refresh")
        public ApiResponse<RefreshResponse> refresh(
                        @RequestBody com.project.ecommerce.modules.identity.dto.request.RefreshRequest request)
                        throws java.text.ParseException, com.nimbusds.jose.JOSEException {
                RefreshResponse result = authenticationService.refreshToken(request);
                return ApiResponse.<RefreshResponse>builder()
                                .code(1000)
                                .message("Refresh token successful")
                                .result(result)
                                .build();
        }

        @Operation(summary = "Logout", description = "Logout user and invalidate token")
        @PostMapping("/logout")
        public ApiResponse<Void> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
                authenticationService.logout(request);
                return ApiResponse.<Void>builder()
                                .code(1000)
                                .message("Logout successful")
                                .build();
        }

        @Operation(summary = "Send OTP", description = "Send OTP via SMS for registration")
        @PostMapping("/register/send-otp")
        @com.project.ecommerce.common.annotation.RateLimit(key = "otp", limit = 3, period = 60)
        public ApiResponse<Void> sendOtp(@RequestBody @Valid SendOtpRequest request) {
                authenticationService.sendOtp(request);
                return ApiResponse.<Void>builder()
                                .code(1000)
                                .message("OTP sent successfully")
                                .build();
        }

        @Operation(summary = "Lookup phone", description = "Check whether a customer phone number already exists")
        @PostMapping("/lookup-phone")
        public ApiResponse<PhoneLookupResponse> lookupPhone(@RequestBody @Valid SendOtpRequest request) {
                return ApiResponse.<PhoneLookupResponse>builder()
                                .code(1000)
                                .message("Phone lookup successful")
                                .result(authenticationService.lookupPhone(request.getPhone()))
                                .build();
        }

        @Operation(summary = "Register", description = "Register a new user with OTP verification")
        @PostMapping("/register")
        public ApiResponse<UserResponse> register(@RequestBody @Valid RegisterRequest request) {
                return ApiResponse.<UserResponse>builder()
                                .code(1000)
                                .message("User registered successfully")
                                .result(authenticationService.register(request))
                                .build();
        }

        @Operation(summary = "Send Forgot Password OTP", description = "Send OTP for password reset")
        @PostMapping("/forgot-password/send-otp")
        @com.project.ecommerce.common.annotation.RateLimit(key = "forgot_otp", limit = 3, period = 60)
        public ApiResponse<Void> sendForgotOtp(@RequestBody @Valid SendOtpRequest request) {
                authenticationService.sendOtpForForgotPassword(request);
                return ApiResponse.<Void>builder()
                                .code(1000)
                                .message("OTP sent successfully to your phone")
                                .build();
        }

        @Operation(summary = "Reset Password", description = "Reset password with OTP verification")
        @PostMapping("/forgot-password/complete")
        public ApiResponse<Void> resetPassword(
                        @RequestBody @Valid ResetPasswordRequest request) {
                authenticationService.resetPassword(request);
                return ApiResponse.<Void>builder()
                                .code(1000)
                                .message("Password has been reset successfully")
                                .build();
        }

        @Operation(summary = "Introspect Token", description = "Verify token validity")
        @PostMapping("/introspect")
        public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
                        throws JOSEException, ParseException {
                IntrospectResponse result = authenticationService.introspect(request);
                return ApiResponse.<IntrospectResponse>builder()
                                .code(1000)
                                .message("Token introspection successful")
                                .result(result)
                                .build();
        }

        @Operation(summary = "Change Password", description = "Change password for authenticated user")
        @PostMapping("/change-password")
        public ApiResponse<Void> changePassword(
                        @RequestBody @Valid ChangePasswordRequest request,
                        org.springframework.security.core.Authentication authentication) {
                String userId = authentication.getName();
                authenticationService.changePassword(userId, request);
                return ApiResponse.<Void>builder()
                                .code(1000)
                                .message("Password changed successfully")
                                .build();
        }
}
