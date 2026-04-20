package com.project.ecommerce.modules.media.controller;

import com.project.ecommerce.common.dto.response.ApiResponse;
import com.project.ecommerce.common.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "ecommerce") String folder) {

        if (file.isEmpty()) {
            return ApiResponse.<Map<String, String>>builder()
                    .code(1001)
                    .message("File is empty")
                    .build();
        }

        try {
            String url = mediaService.uploadImage(file, folder);
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            return ApiResponse.<Map<String, String>>builder()
                    .code(1000)
                    .message("Upload successful")
                    .result(result)
                    .build();
        } catch (IOException e) {
            return ApiResponse.<Map<String, String>>builder()
                    .code(9999)
                    .message("Upload failed: " + e.getMessage())
                    .build();
        }
    }
}
