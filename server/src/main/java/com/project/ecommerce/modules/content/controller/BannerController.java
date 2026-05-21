package com.project.ecommerce.modules.content.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.content.dto.request.CreateBannerRequest;
import com.project.ecommerce.modules.content.dto.request.UpdateBannerRequest;
import com.project.ecommerce.modules.content.dto.response.BannerResponse;
import com.project.ecommerce.modules.content.entity.Banner;
import com.project.ecommerce.modules.content.service.BannerService;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/banners")
@RequiredArgsConstructor
@Tag(name = "Banner Controller", description = "APIs for managing banners and marketing assets")
public class BannerController {
    private final BannerService bannerService;

    @Operation(summary = "Get active banners for client")
    @GetMapping("/active")
    public ApiResponse<List<BannerResponse>> getActiveBanners() {
        return ApiResponse.<List<BannerResponse>>builder()
                .code(1000)
                .message("Success")
                .result(bannerService.getActiveBanners())
                .build();
    }

    @Operation(summary = "Get banners by position")
    @GetMapping("/position/{position}")
    public ApiResponse<List<BannerResponse>> getBannersByPosition(@PathVariable String position) {
        return ApiResponse.<List<BannerResponse>>builder()
                .code(1000)
                .message("Success")
                .result(bannerService.getBannersByPosition(position))
                .build();
    }

    @Operation(summary = "Admin: Get all banners with filtering")
    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<BannerResponse>> getBanners(
            @Filter Specification<Banner> spec,
            Pageable pageable) {
        return ApiResponse.<PageResponse<BannerResponse>>builder()
                .code(1000)
                .message("Success")
                .result(bannerService.getBanners(spec, pageable))
                .build();
    }

    @Operation(summary = "Admin: Get banner by ID")
    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BannerResponse> getById(@PathVariable String id) {
        return ApiResponse.<BannerResponse>builder()
                .code(1000)
                .message("Success")
                .result(bannerService.getBannerById(id))
                .build();
    }

    @Operation(summary = "Admin: Create new banner")
    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BannerResponse> create(@RequestBody @Valid CreateBannerRequest request) {
        return ApiResponse.<BannerResponse>builder()
                .code(1000)
                .message("Banner created successfully")
                .result(bannerService.createBanner(request))
                .build();
    }

    @Operation(summary = "Admin: Update banner")
    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BannerResponse> update(
            @PathVariable String id,
            @RequestBody @Valid UpdateBannerRequest request) {
        return ApiResponse.<BannerResponse>builder()
                .code(1000)
                .message("Banner updated successfully")
                .result(bannerService.updateBanner(id, request))
                .build();
    }

    @Operation(summary = "Admin: Delete banner")
    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable String id) {
        bannerService.deleteBanner(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Banner deleted successfully")
                .build();
    }
}
