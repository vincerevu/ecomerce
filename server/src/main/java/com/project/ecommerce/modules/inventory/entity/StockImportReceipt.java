package com.project.ecommerce.modules.inventory.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import lombok.Builder;
import lombok.AccessLevel;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "stock_import_receipts")
public class StockImportReceipt extends BaseEntity<String> {

    @Column(nullable = false, unique = true)
    String receiptCode;

    String supplierName;

    @Column(columnDefinition = "TEXT")
    String note;

    LocalDateTime importedAt;

    @Builder.Default
    BigDecimal totalAmount = BigDecimal.ZERO;

    @Builder.Default
    @OneToMany(mappedBy = "receipt", cascade = { CascadeType.PERSIST, CascadeType.MERGE }, orphanRemoval = true)
    List<StockImportItem> items = new ArrayList<>();
}
