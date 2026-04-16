package com.djsabi.backend

import com.cloudinary.Cloudinary
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class CloudinaryUsageResponse(
    val storageBytesUsed: Long,
    val storageBytesLimit: Long,
    val storagePercent: Double,
    val objectCount: Long,
    val bandwidthBytesUsed: Long,
    val bandwidthBytesLimit: Long,
    val plan: String
)

@RestController
@RequestMapping("/api/admin")
class AdminCloudinaryController(
    private val cloudinary: Cloudinary,
    private val authService: AdminAuthService
) {
    private fun authorized(req: HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    @GetMapping("/cloudinary-usage")
    fun usage(req: HttpServletRequest): ResponseEntity<CloudinaryUsageResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()

        @Suppress("UNCHECKED_CAST")
        val data = cloudinary.api().usage(emptyMap<String, Any>()) as Map<String, Any>

        @Suppress("UNCHECKED_CAST")
        val storage = data["storage"] as? Map<String, Any> ?: emptyMap()
        @Suppress("UNCHECKED_CAST")
        val objects = data["objects"] as? Map<String, Any> ?: emptyMap()
        @Suppress("UNCHECKED_CAST")
        val bandwidth = data["bandwidth"] as? Map<String, Any> ?: emptyMap()

        return ResponseEntity.ok(
            CloudinaryUsageResponse(
                storageBytesUsed = (storage["usage"] as? Number)?.toLong() ?: 0L,
                storageBytesLimit = (storage["limit"] as? Number)?.toLong() ?: 0L,
                storagePercent = (storage["used_percent"] as? Number)?.toDouble() ?: 0.0,
                objectCount = (objects["usage"] as? Number)?.toLong() ?: 0L,
                bandwidthBytesUsed = (bandwidth["usage"] as? Number)?.toLong() ?: 0L,
                bandwidthBytesLimit = (bandwidth["limit"] as? Number)?.toLong() ?: 0L,
                plan = data["plan"] as? String ?: ""
            )
        )
    }
}
