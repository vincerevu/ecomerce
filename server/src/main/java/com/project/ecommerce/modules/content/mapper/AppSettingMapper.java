package com.project.ecommerce.modules.content.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.content.dto.response.AppSettingResponse;
import com.project.ecommerce.modules.content.entity.AppSetting;
import org.mapstruct.Mapper;

@Mapper(config = CentralMapperConfig.class)
public interface AppSettingMapper {
    AppSettingResponse toAppSettingResponse(AppSetting appSetting);
}
