package com.project.ecommerce.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class MediaService {
    private final R2Service r2Service;

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        return r2Service.upload(file, folder);
    }
}
