package com.project.ecommerce.modules.identity.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "point_history")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PointHistory extends BaseEntity<String> {
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;
    private Integer points;
    private String reason;
    private String orderId;
}
