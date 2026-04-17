package com.djsabi.backend

import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request

data class R2UsageResponse(
    val storageBytesUsed: Long,
    val objectCount: Long
)

@RestController
@RequestMapping("/api/admin")
class AdminR2Controller(
    private val s3Client: S3Client,
    private val authService: AdminAuthService,
    @Value("\${r2.bucket-name}") private val r2BucketName: String
) {
    private fun authorized(req: HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    @GetMapping("/r2-usage")
    fun usage(req: HttpServletRequest): ResponseEntity<R2UsageResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (r2BucketName.isBlank()) return ResponseEntity.status(503).build()

        return try {
            var totalBytes = 0L
            var totalObjects = 0L
            var continuationToken: String? = null

            do {
                val request = ListObjectsV2Request.builder()
                    .bucket(r2BucketName)
                    .also { if (continuationToken != null) it.continuationToken(continuationToken) }
                    .build()
                val response = s3Client.listObjectsV2(request)
                totalBytes += response.contents().sumOf { it.size() }
                totalObjects += response.contents().size
                continuationToken = if (response.isTruncated == true) response.nextContinuationToken() else null
            } while (continuationToken != null)

            ResponseEntity.ok(R2UsageResponse(totalBytes, totalObjects))
        } catch (e: Exception) {
            ResponseEntity.status(503).build()
        }
    }
}
