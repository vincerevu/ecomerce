package com.project.ecommerce.modules.identity.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.identity.dto.request.CreateMembershipTierRequest;
import com.project.ecommerce.modules.identity.dto.request.UpdateMembershipTierRequest;
import com.project.ecommerce.modules.identity.dto.response.MembershipTierResponse;
import com.project.ecommerce.modules.identity.entity.MembershipTier;
import com.project.ecommerce.modules.identity.mapper.MembershipTierMapper;
import com.project.ecommerce.modules.identity.repository.MembershipTierRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MembershipTierService {
    MembershipTierRepository membershipTierRepository;
    MembershipTierMapper membershipTierMapper;

    @PreAuthorize("hasAuthority('MEMBERSHIP_TIER:CREATE')")
    @CacheEvict(value = "membership_tiers", allEntries = true)
    public MembershipTierResponse createMembershipTier(CreateMembershipTierRequest request) {
        if (membershipTierRepository.findByTierName(request.getTierName()).isPresent()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        MembershipTier tier = membershipTierMapper.toTier(request);
        return membershipTierMapper.toResponse(membershipTierRepository.save(tier));
    }

    @PreAuthorize("hasAuthority('MEMBERSHIP_TIER:VIEW')")
    @Cacheable(value = "membership_tiers", key = "'all'")
    public List<MembershipTierResponse> getAllMembershipTiers() {
        return membershipTierRepository.findAll()
                .stream()
                .map(membershipTierMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasAuthority('MEMBERSHIP_TIER:VIEW')")
    @Cacheable(value = "membership_tiers", key = "'id_' + #id")
    public MembershipTierResponse getMembershipTierById(String id) {
        MembershipTier tier = membershipTierRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        return membershipTierMapper.toResponse(tier);
    }

    @PreAuthorize("hasAuthority('MEMBERSHIP_TIER:UPDATE')")
    @CacheEvict(value = "membership_tiers", allEntries = true)
    public MembershipTierResponse updateMembershipTier(String id, UpdateMembershipTierRequest request) {
        MembershipTier tier = membershipTierRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));

        membershipTierMapper.updateTier(tier, request);

        return membershipTierMapper.toResponse(membershipTierRepository.save(tier));
    }

    @Transactional
    @PreAuthorize("hasAuthority('MEMBERSHIP_TIER:DELETE')")
    @CacheEvict(value = "membership_tiers", allEntries = true)
    public void deleteMembershipTier(String id) {
        MembershipTier tier = membershipTierRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        tier.setIsDeleted(true);
        membershipTierRepository.save(tier);
    }
}
