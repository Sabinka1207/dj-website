package com.djsabi.backend

import com.cloudinary.Cloudinary
import com.djsabi.backend.model.Mix
import com.djsabi.backend.repository.MixRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

data class MixAdminResponse(
    val id: Long,
    val publicId: String,
    val url: String,
    val title: String,
    val year: Int,
    val style: String,
    val event: String,
    val city: String,
    val durationSeconds: Int,
    val displayOrder: Int
)

data class MixReorderItem(val id: Long, val displayOrder: Int)

@RestController
@RequestMapping("/api/admin/mixes")
class AdminMixController(
    private val mixRepository: MixRepository,
    private val cloudinary: Cloudinary,
    private val authService: AdminAuthService
) {

    private fun authorized(req: HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    @GetMapping
    fun list(req: HttpServletRequest): ResponseEntity<List<MixAdminResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        return ResponseEntity.ok(
            mixRepository.findAll()
                .sortedBy { it.displayOrder }
                .map { MixAdminResponse(it.id, it.publicId, it.url, it.title, it.year, it.style, it.event, it.city, it.durationSeconds, it.displayOrder) }
        )
    }

    @PostMapping("/upload")
    fun upload(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("title") title: String,
        @RequestParam("year") year: Int,
        @RequestParam("style") style: String,
        @RequestParam("event", defaultValue = "") event: String,
        @RequestParam("city", defaultValue = "") city: String,
        req: HttpServletRequest
    ): ResponseEntity<MixAdminResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()

        val result = cloudinary.uploader().upload(
            file.bytes,
            mapOf("folder" to "dj-sabi/mixes", "resource_type" to "video")
        )

        val duration = ((result["duration"] as? Number)?.toDouble() ?: 0.0).toInt()
        val maxOrder = mixRepository.findAll().maxOfOrNull { it.displayOrder } ?: -1

        val mix = mixRepository.save(
            Mix(
                publicId = result["public_id"] as String,
                url = result["secure_url"] as String,
                title = title,
                year = year,
                style = style,
                event = event,
                city = city,
                durationSeconds = duration,
                displayOrder = maxOrder + 1
            )
        )

        return ResponseEntity.ok(
            MixAdminResponse(mix.id, mix.publicId, mix.url, mix.title, mix.year, mix.style, mix.event, mix.city, mix.durationSeconds, mix.displayOrder)
        )
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, req: HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = mixRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        cloudinary.uploader().destroy(mix.publicId, mapOf("resource_type" to "video"))
        mixRepository.delete(mix)
        return ResponseEntity.noContent().build()
    }

    @Transactional
    @PutMapping("/reorder")
    fun reorder(@RequestBody items: List<MixReorderItem>, req: HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        items.forEach { item ->
            mixRepository.findById(item.id).ifPresent { mix ->
                mix.displayOrder = item.displayOrder
                mixRepository.save(mix)
            }
        }
        return ResponseEntity.ok().build()
    }
}
