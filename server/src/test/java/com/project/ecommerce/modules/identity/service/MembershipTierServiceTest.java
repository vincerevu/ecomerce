package com.project.ecommerce.modules.identity.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.ecommerce.modules.identity.entity.MembershipTier;
import com.project.ecommerce.modules.identity.mapper.MembershipTierMapper;
import com.project.ecommerce.modules.identity.repository.MembershipTierRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MembershipTierServiceTest {

    @Mock
    private MembershipTierRepository membershipTierRepository;

    @Mock
    private MembershipTierMapper membershipTierMapper;

    @InjectMocks
    private MembershipTierService membershipTierService;

    @Test
    void deleteMembershipTier_shouldSoftDeleteTier() {
        MembershipTier tier = MembershipTier.builder()
                .id("tier-1")
                .tierName("Gold")
                .isDeleted(false)
                .build();
        when(membershipTierRepository.findById("tier-1")).thenReturn(Optional.of(tier));

        membershipTierService.deleteMembershipTier("tier-1");

        assertThat(tier.getIsDeleted()).isTrue();
        verify(membershipTierRepository).save(tier);
    }
}
