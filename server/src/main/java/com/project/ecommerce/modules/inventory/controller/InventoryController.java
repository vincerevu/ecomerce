package com.project.ecommerce.modules.inventory.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.dto.response.PageResponse;
import com.project.ecommerce.modules.inventory.dto.request.CreateStockImportReceiptRequest;
import com.project.ecommerce.modules.inventory.dto.response.InventoryMovementResponse;
import com.project.ecommerce.modules.inventory.dto.response.InventoryStockResponse;
import com.project.ecommerce.modules.inventory.dto.response.StockImportReceiptResponse;
import com.project.ecommerce.modules.inventory.entity.InventoryMovement;
import com.project.ecommerce.modules.inventory.entity.StockImportReceipt;
import com.project.ecommerce.modules.inventory.service.InventoryService;
import com.project.ecommerce.modules.product.entity.ProductVariant;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory Controller", description = "APIs for stock overview, import receipts, and inventory movements")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stocks")
    public ApiResponse<PageResponse<InventoryStockResponse>> getStocks(
            Pageable pageable,
            @Filter Specification<ProductVariant> spec) {
        return ApiResponse.<PageResponse<InventoryStockResponse>>builder()
                .code(1000)
                .message("Success")
                .result(inventoryService.getStocks(pageable, spec))
                .build();
    }

    @GetMapping("/receipts")
    public ApiResponse<PageResponse<StockImportReceiptResponse>> getReceipts(
            Pageable pageable,
            @Filter Specification<StockImportReceipt> spec) {
        return ApiResponse.<PageResponse<StockImportReceiptResponse>>builder()
                .code(1000)
                .message("Success")
                .result(inventoryService.getReceipts(pageable, spec))
                .build();
    }

    @GetMapping("/receipts/{id}")
    public ApiResponse<StockImportReceiptResponse> getReceiptById(@PathVariable String id) {
        return ApiResponse.<StockImportReceiptResponse>builder()
                .code(1000)
                .message("Success")
                .result(inventoryService.getReceiptById(id))
                .build();
    }

    @PostMapping("/receipts")
    public ApiResponse<StockImportReceiptResponse> createReceipt(
            @Valid @RequestBody CreateStockImportReceiptRequest request) {
        return ApiResponse.<StockImportReceiptResponse>builder()
                .code(1000)
                .message("Stock import created")
                .result(inventoryService.createReceipt(request))
                .build();
    }

    @GetMapping("/movements")
    public ApiResponse<PageResponse<InventoryMovementResponse>> getMovements(
            Pageable pageable,
            @Filter Specification<InventoryMovement> spec) {
        return ApiResponse.<PageResponse<InventoryMovementResponse>>builder()
                .code(1000)
                .message("Success")
                .result(inventoryService.getMovements(pageable, spec))
                .build();
    }
}
