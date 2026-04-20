package com.project.ecommerce.modules.identity.repository;

import com.project.ecommerce.modules.identity.entity.MembershipTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MembershipTierRepository extends JpaRepository<MembershipTier, String> {
    Optional<MembershipTier> findByTierName(String tierName);
}
