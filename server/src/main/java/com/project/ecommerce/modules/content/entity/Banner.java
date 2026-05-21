package com.project.ecommerce.modules.content.entity;

import com.project.ecommerce.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "banners")
public class Banner extends BaseEntity<String> {

    @Column(nullable = false)
    String title;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    String imageUrl;

    @Column(name = "link_url")
    String linkUrl;

    @Column(name = "position")
    String position; // e.g., HOME_MAIN, HOME_SIDEBAR, POPUP

    @Column(name = "priority")
    @Builder.Default
    Integer priority = 0;

    @Column(nullable = false)
    @Builder.Default
    Boolean active = true;

    @Column(name = "start_date")
    LocalDateTime startDate;

    @Column(name = "end_date")
    LocalDateTime endDate;
}
