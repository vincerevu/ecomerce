package com.project.ecommerce.modules.identity.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.project.ecommerce.modules.identity.dto.request.*;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.common.service.RedisService;

import com.project.ecommerce.modules.identity.dto.response.IntrospectResponse;
import com.project.ecommerce.modules.identity.dto.response.LoginResponse;

import com.project.ecommerce.modules.identity.dto.response.PhoneLookupResponse;
import com.project.ecommerce.modules.identity.dto.response.RefreshResponse;
import com.project.ecommerce.modules.identity.dto.response.UserResponse;
import com.project.ecommerce.modules.identity.entity.User;
import com.project.ecommerce.modules.identity.enums.UserType;
import com.project.ecommerce.modules.identity.mapper.UserMapper;
import com.project.ecommerce.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

import com.project.ecommerce.modules.message.service.SmsService;
import com.project.ecommerce.modules.identity.repository.RoleRepository;
import com.project.ecommerce.modules.identity.enums.RoleEnum;
import com.project.ecommerce.modules.identity.entity.Role;
import java.util.HashSet;
import java.util.concurrent.TimeUnit;

import com.project.ecommerce.modules.message.template.MessageTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    @Value("${app.jwt.access-token.secret}")
    private String accessKey;

    @Value("${app.jwt.access-token.expiration}")
    private long accessDuration;

    @Value("${app.jwt.refresh-token.secret}")
    private String refreshKey;

    @Value("${app.jwt.refresh-token.expiration}")
    private long refreshDuration;

    private final RedisService redisService;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final SmsService smsService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token, false);
        } catch (AppException e) {
            isValid = false;
        }

        return IntrospectResponse.builder().valid(isValid).build();
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = request.getPhone();
        User user = userRepository.findByPhone(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        boolean isVerified = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!isVerified) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (!user.isActive()) {
            throw new AppException(ErrorCode.USER_NOT_ACTIVE);
        }

        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toResponse(user))
                .build();
    }

    public RefreshResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        if (request.getToken() == null || request.getToken().isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        SignedJWT signedJWT = verifyToken(request.getToken(), true);
        String jit = signedJWT.getJWTClaimsSet().getJWTID();
        String userId = signedJWT.getJWTClaimsSet().getSubject();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (!user.isActive()) {
            throw new AppException(ErrorCode.USER_NOT_ACTIVE);
        }

        // Blacklist old token
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        long expiryTimeInMillis = expiryTime.getTime() - System.currentTimeMillis();
        if (expiryTimeInMillis > 0) {
            redisService.save(jit, "expired", expiryTimeInMillis, java.util.concurrent.TimeUnit.MILLISECONDS);
        }

        String accessToken = generateAccessToken(user);
        String newRefreshToken = generateRefreshToken(user);

        return RefreshResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        SignedJWT signToken = verifyToken(request.getToken(), true);
        String jit = signToken.getJWTClaimsSet().getJWTID();
        Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();
        long expiryTimeInMillis = expiryTime.getTime() - System.currentTimeMillis();

        if (expiryTimeInMillis > 0) {
            redisService.save(jit, "expired", expiryTimeInMillis, TimeUnit.MILLISECONDS);
        }
    }

    public void sendOtp(SendOtpRequest request) {
        internalSendOtp(request.getPhone(), "otp:");
    }

    public PhoneLookupResponse lookupPhone(String phone) {
        return PhoneLookupResponse.builder()
                .existed(userRepository.existsByPhone(phone))
                .build();
    }

    public void sendOtpForForgotPassword(SendOtpRequest request) {
        if (!userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        internalSendOtp(request.getPhone(), "forgot_otp:");
    }

    public void sendOrderCancelOtp(String phone) {
        internalSendOtp(phone, "order_cancel_otp:");
    }

    public void verifyOrderCancelOtp(String phone, String otp) {
        verifyOtp(phone, otp, "order_cancel_otp:");
    }

    public void resetPassword(ResetPasswordRequest request) {
        verifyOtp(request.getPhone(), request.getOtp(), "forgot_otp:");

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_CURRENT_PASSWORD);
        }

        // Check if new password matches confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private void internalSendOtp(String phone, String keyPrefix) {
        java.security.SecureRandom random = new java.security.SecureRandom();
        int otpValue = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpValue);
        redisService.save(keyPrefix + phone, otp, 5, TimeUnit.MINUTES);
        smsService.sendSms(phone, MessageTemplate.otpTemplate(otp));
    }

    private void verifyOtp(String phone, String otp, String keyPrefix) {
        String savedOtp = (String) redisService.get(keyPrefix + phone);
        if (savedOtp == null || !savedOtp.equals(otp)) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        redisService.delete(keyPrefix + phone);
    }

    public UserResponse register(RegisterRequest request) {
        String savedOtp = (String) redisService.get("otp:" + request.getPhone());
        if (savedOtp == null || !savedOtp.equals(request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        redisService.delete("otp:" + request.getPhone());

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        User user = User.builder()
                .phone(request.getPhone())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .active(true)
                .type(UserType.CUSTOMER)
                .build();

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findByNameAndIsDeletedFalse(RoleEnum.USER.name()).ifPresent(roles::add);
        user.setRoles(roles);

        return userMapper.toResponse(userRepository.save(user));
    }

    private String generateAccessToken(User user) {
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS512)
                .type(JOSEObjectType.JWT)
                .build();
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer("bagy.io")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(accessDuration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(accessKey.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    private String generateRefreshToken(User user) {
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS512)
                .type(JOSEObjectType.JWT)
                .build();
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId())
                .issuer("bagy.io")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(refreshDuration, ChronoUnit.SECONDS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(refreshKey.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create token", e);
            throw new RuntimeException(e);
        }
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        if (token == null || token.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        JWSVerifier verifier = new MACVerifier(isRefresh ? refreshKey.getBytes() : accessKey.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);
        Date expiryTime = (isRefresh)
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime()
                        .toInstant().plus(refreshDuration, ChronoUnit.SECONDS).toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expiryTime.after(new Date())))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (redisService.hasKey(signedJWT.getJWTClaimsSet().getJWTID()))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");

        if (!CollectionUtils.isEmpty(user.getRoles()))
            user.getRoles().forEach(role -> {
                stringJoiner.add("ROLE_" + role.getName());
                if (!CollectionUtils.isEmpty(role.getPermissions()))
                    role.getPermissions().forEach(permission -> stringJoiner.add(permission.getName()));
            });

        return stringJoiner.toString();
    }
}
