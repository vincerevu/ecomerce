package com.project.ecommerce.common.service;

import com.project.ecommerce.modules.content.dto.response.PresignedUrlResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class R2Service {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.r2.bucket-name}")
    private String bucketName;

    @Value("${app.r2.public-url}")
    private String publicUrl;

    @PostConstruct
    public void validate() {
        if (!StringUtils.hasText(bucketName) || !StringUtils.hasText(publicUrl)) {
            log.error("R2 service configuration is incomplete. Check R2_BUCKET_NAME and R2_PUBLIC_URL.");
            throw new IllegalStateException("R2_BUCKET_NAME or R2_PUBLIC_URL is not set.");
        }
    }

    public PresignedUrlResponse generateUploadUrl(String folder, String fileName, String contentType) {
        String fileKey = String.format("%s/%s-%s", folder, UUID.randomUUID(), fileName);

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(10))
                .putObjectRequest(objectRequest)
                .build();

        String uploadUrl = s3Presigner.presignPutObject(presignRequest).url().toString();

        return PresignedUrlResponse.builder()
                .uploadUrl(uploadUrl)
                .publicUrl(String.format("%s/%s", publicUrl, fileKey))
                .fileKey(fileKey)
                .build();
    }

    public String upload(MultipartFile file, String folder) throws IOException {
        String fileKey = String.format("%s/%s-%s", folder, UUID.randomUUID(), file.getOriginalFilename());

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        return String.format("%s/%s", publicUrl, fileKey);
    }

    public void deleteFile(String fileKey) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(fileKey)
                .build();
        s3Client.deleteObject(deleteObjectRequest);
    }
}
