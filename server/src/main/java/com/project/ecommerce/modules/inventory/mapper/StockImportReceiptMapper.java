package com.project.ecommerce.modules.inventory.mapper;

import com.project.ecommerce.common.mapper.CentralMapperConfig;
import com.project.ecommerce.modules.inventory.dto.response.StockImportItemResponse;
import com.project.ecommerce.modules.inventory.dto.response.StockImportReceiptResponse;
import com.project.ecommerce.modules.inventory.entity.StockImportItem;
import com.project.ecommerce.modules.inventory.entity.StockImportReceipt;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = CentralMapperConfig.class)
public interface StockImportReceiptMapper {

    @Mapping(target = "productVariantId", source = "productVariant.id")
    @Mapping(target = "productId", source = "productVariant.productColor.product.id")
    @Mapping(target = "productName", source = "productVariant.productColor.product.name")
    @Mapping(target = "colorName", source = "productVariant.productColor.colorName")
    @Mapping(target = "sizeName", source = "productVariant.sizeName")
    StockImportItemResponse toItemResponse(StockImportItem item);

    @Mapping(target = "items", expression = "java(toItemResponses(receipt.getItems()))")
    @Mapping(target = "totalQuantity", expression = "java(receipt.getItems() == null ? 0 : receipt.getItems().stream().mapToInt(item -> item.getQuantity() == null ? 0 : item.getQuantity()).sum())")
    @Mapping(target = "totalLines", expression = "java(receipt.getItems() == null ? 0 : receipt.getItems().size())")
    StockImportReceiptResponse toResponse(StockImportReceipt receipt);

    List<StockImportItemResponse> toItemResponses(List<StockImportItem> items);
}
