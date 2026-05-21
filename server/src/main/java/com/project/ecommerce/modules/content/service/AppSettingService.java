package com.project.ecommerce.modules.content.service;

import com.project.ecommerce.modules.content.dto.request.AppSettingRequest;
import com.project.ecommerce.modules.content.dto.response.AppSettingResponse;
import com.project.ecommerce.modules.content.entity.AppSetting;
import com.project.ecommerce.modules.content.mapper.AppSettingMapper;
import com.project.ecommerce.modules.content.repository.AppSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppSettingService {
    private final AppSettingRepository appSettingRepository;
    private final AppSettingMapper appSettingMapper;

    @Cacheable(value = "settings", key = "#key", unless = "#result == #defaultValue")
    public String getSetting(String key, String defaultValue) {
        return appSettingRepository.findByKey(key)
                .map(AppSetting::getValue)
                .orElse(defaultValue);
    }

    public Integer getIntSetting(String key, Integer defaultValue) {
        String value = getSetting(key, null);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    @Cacheable(value = "settings", key = "'all'")
    public List<AppSettingResponse> getAllSettings() {
        return appSettingRepository.findAll().stream()
                .map(appSettingMapper::toAppSettingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "settings", allEntries = true)
    public AppSettingResponse updateSetting(String key, AppSettingRequest request) {
        AppSetting setting = appSettingRepository.findByKey(key)
                .orElse(AppSetting.builder().key(key).build());
        
        setting.setValue(request.getValue());
        if (request.getDescription() != null) setting.setDescription(request.getDescription());
        if (request.getGroup() != null) setting.setGroup(request.getGroup());
        
        return appSettingMapper.toAppSettingResponse(appSettingRepository.save(setting));
    }
}
