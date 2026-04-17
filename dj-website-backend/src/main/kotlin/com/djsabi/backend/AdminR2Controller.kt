package com.djsabi.backend

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class R2UsageResponse(
    val storageBytesUsed: Long,
    val objectCount: Long,
    val classAOps: Long,
    val classBOps: Long
)

@RestController
@RequestMapping("/api/admin")
class AdminR2Controller(
    private val s3Client: S3Client,
    private val objectMapper: ObjectMapper,
    private val authService: AdminAuthService,
    @Value("\${r2.bucket-name:}") private val r2BucketName: String,
    @Value("\${r2.account-id:}") private val r2AccountId: String,
    @Value("\${cloudflare.api-token:}") private val cfApiToken: String
) {
    private fun authorized(req: HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    // Class A operations: write, list, delete (per Cloudflare R2 pricing)
    private val classAActionTypes = setOf(
        "ListBuckets", "ListObjects", "ListObjectsV2", "PutObject", "CopyObject",
        "CreateMultipartUpload", "UploadPart", "UploadPartCopy", "CompleteMultipartUpload",
        "AbortMultipartUpload", "ListMultipartUploads", "ListParts",
        "DeleteObject", "DeleteObjects", "CreateBucket", "DeleteBucket",
        "PutBucketCors", "DeleteBucketCors",
        "PutBucketLifecycleConfiguration", "DeleteBucketLifecycleConfiguration",
        "PutBucketEncryption", "DeleteBucketEncryption"
    )

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

            val (classAOps, classBOps) = fetchOpsFromCloudflare()

            ResponseEntity.ok(R2UsageResponse(totalBytes, totalObjects, classAOps, classBOps))
        } catch (e: Exception) {
            ResponseEntity.status(503).build()
        }
    }

    private fun fetchOpsFromCloudflare(): Pair<Long, Long> {
        if (r2AccountId.isBlank() || cfApiToken.isBlank()) return Pair(0L, 0L)

        val startOfMonth = LocalDate.now().withDayOfMonth(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
        val query = """{ viewer { accounts(filter: {accountTag: "$r2AccountId"}) { r2OperationsAdaptiveGroups(filter: {date_geq: "$startOfMonth"}, limit: 10000) { sum { requests } dimensions { actionType } } } } }"""
        val jsonBody = """{"query":${objectMapper.writeValueAsString(query)}}"""

        val httpClient = HttpClient.newHttpClient()
        val httpRequest = HttpRequest.newBuilder()
            .uri(URI.create("https://api.cloudflare.com/client/v4/graphql"))
            .header("Authorization", "Bearer $cfApiToken")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build()

        val response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() != 200) return Pair(0L, 0L)

        val root = objectMapper.readTree(response.body())
        val groups = root
            .path("data").path("viewer").path("accounts")
            .get(0)?.path("r2OperationsAdaptiveGroups")
            ?: return Pair(0L, 0L)

        var classA = 0L
        var classB = 0L
        groups.forEach { group ->
            val actionType = group.path("dimensions").path("actionType").asText()
            val requests = group.path("sum").path("requests").asLong()
            if (actionType in classAActionTypes) classA += requests else classB += requests
        }
        return Pair(classA, classB)
    }
}
