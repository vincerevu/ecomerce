package com.project.ecommerce.modules.product.projection;

public interface LowStockProductSummary {
    String getProductId();
    String getProductName();
    long getTotalStock();
    long getVariantCount();
}
