package com.project.ecommerce.modules.product.service;

import com.project.ecommerce.common.exceptions.AppException;
import com.project.ecommerce.common.exceptions.ErrorCode;
import com.project.ecommerce.modules.product.dto.request.CreateTagRequest;
import com.project.ecommerce.modules.product.dto.response.TagResponse;
import com.project.ecommerce.modules.product.entity.Tag;
import com.project.ecommerce.modules.product.mapper.TagMapper;
import com.project.ecommerce.modules.product.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    @Transactional(readOnly = true)
    public List<TagResponse> getAll(Specification<Tag> spec) {
        return tagRepository.findAll(spec).stream()
                .map(tagMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TagResponse getById(String id) {
        return tagMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    @PreAuthorize("hasAuthority('TAG:CREATE')")
    public TagResponse create(CreateTagRequest req) {
        return tagMapper.toResponse(tagRepository.save(tagMapper.toEntity(req)));
    }

    @Transactional
    @PreAuthorize("hasAuthority('TAG:UPDATE')")
    public TagResponse update(String id, CreateTagRequest req) {
        Tag tag = findOrThrow(id);
        tagMapper.updateTag(tag, req);
        return tagMapper.toResponse(tagRepository.save(tag));
    }

    @Transactional
    @PreAuthorize("hasAuthority('TAG:DELETE')")
    public void delete(String id) {
        Tag tag = findOrThrow(id);
        tag.setIsDeleted(true);
        tagRepository.save(tag);
    }

    // ──────────────── HELPERS ────────────────

    private Tag findOrThrow(String id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
    }
}
