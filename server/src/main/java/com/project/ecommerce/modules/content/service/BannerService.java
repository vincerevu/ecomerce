package com.project.ecommerce.modules.content.service;

import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.content.dto.request.CreateBannerRequest;
import com.project.ecommerce.modules.content.dto.request.UpdateBannerRequest;
import com.project.ecommerce.modules.content.dto.response.BannerResponse;
import com.project.ecommerce.modules.content.entity.Banner;
import com.project.ecommerce.modules.content.mapper.BannerMapper;
import com.project.ecommerce.modules.content.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BannerService {
    private static final String DEFAULT_BANNER_POSITION = "HOME_MAIN";

    private final BannerRepository bannerRepository;
    private final BannerMapper bannerMapper;

    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findActiveBanners(LocalDateTime.now()).stream()
                .map(bannerMapper::toBannerResponse)
                .collect(Collectors.toList());
    }

    public List<BannerResponse> getBannersByPosition(String position) {
        return bannerRepository.findByPositionAndActiveTrueOrderByPriorityDesc(position).stream()
                .map(bannerMapper::toBannerResponse)
                .collect(Collectors.toList());
    }

    public PageResponse<BannerResponse> getBanners(Specification<Banner> spec, Pageable pageable) {
        Page<Banner> page = bannerRepository.findAll(spec, pageable);
        return PageResponse.<BannerResponse>builder()
                .currentPage(page.getNumber() + 1)
                .pageSize(page.getSize())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .data(page.getContent().stream()
                        .map(bannerMapper::toBannerResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public BannerResponse createBanner(CreateBannerRequest request) {
        Banner banner = bannerMapper.toBanner(request);
        banner.setPosition(DEFAULT_BANNER_POSITION);
        return bannerMapper.toBannerResponse(bannerRepository.save(banner));
    }

    @Transactional
    public BannerResponse updateBanner(String id, UpdateBannerRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
        
        bannerMapper.updateBanner(banner, request);
        banner.setPosition(DEFAULT_BANNER_POSITION);
        return bannerMapper.toBannerResponse(bannerRepository.save(banner));
    }

    @Transactional
    public void deleteBanner(String id) {
        if (!bannerRepository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        bannerRepository.deleteById(id);
    }

    public BannerResponse getBannerById(String id) {
        return bannerRepository.findById(id)
                .map(bannerMapper::toBannerResponse)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
    }
}
