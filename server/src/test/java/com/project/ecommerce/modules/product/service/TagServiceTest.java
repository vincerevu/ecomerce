package com.project.ecommerce.modules.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.project.ecommerce.modules.product.entity.Tag;
import com.project.ecommerce.modules.product.mapper.TagMapper;
import com.project.ecommerce.modules.product.repository.TagRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @Mock
    private TagMapper tagMapper;

    @InjectMocks
    private TagService tagService;

    @Test
    void delete_shouldSoftDeleteTag() {
        Tag tag = Tag.builder()
                .id("tag-1")
                .name("Tag")
                .slug("tag")
                .isDeleted(false)
                .build();
        when(tagRepository.findById("tag-1")).thenReturn(Optional.of(tag));

        tagService.delete("tag-1");

        assertThat(tag.getIsDeleted()).isTrue();
        verify(tagRepository).save(tag);
    }
}
