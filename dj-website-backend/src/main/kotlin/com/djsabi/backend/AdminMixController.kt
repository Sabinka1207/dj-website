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
    val coverUrl: String,
    val title: String,
    val year: Int,
    val style: String,
    val event: String,
    val city: String,
    val durationSeconds: Int,
    val displayOrder: Int,
    val homeFeatured: Boolean,
    val homeDisplayOrder: Int
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
                .map { MixAdminResponse(it.id, it.publicId, it.url, it.coverUrl, it.title, it.year, it.style, it.event, it.city, it.durationSeconds, it.displayOrder, it.homeFeatured, it.homeDisplayOrder) }
        )
    }

    @PostMapping("/upload")
    fun upload(
        @RequestParam("file") file: MultipartFile,
        @RequestParam("cover", required = false) cover: MultipartFile?,
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

        var coverUrl = ""
        var coverPublicId = ""
        if (cover != null && cover.size > 0) {
            val coverResult = cloudinary.uploader().upload(
                cover.bytes,
                mapOf("folder" to "dj-sabi/mix-covers", "resource_type" to "image")
            )
            coverUrl = coverResult["secure_url"] as String
            coverPublicId = coverResult["public_id"] as String
        }

        val duration = ((result["duration"] as? Number)?.toDouble() ?: 0.0).toInt()
        val maxOrder = mixRepository.findAll().maxOfOrNull { it.displayOrder } ?: -1

        val mix = mixRepository.save(
            Mix(
                publicId = result["public_id"] as String,
                url = result["secure_url"] as String,
                coverUrl = coverUrl,
                title = title,
                year = year,
                style = style,
                event = event,
                city = city,
                durationSeconds = duration,
                displayOrder = maxOrder + 1,
                coverPublicId = coverPublicId
            )
        )

        return ResponseEntity.ok(
            MixAdminResponse(mix.id, mix.publicId, mix.url, mix.coverUrl, mix.title, mix.year, mix.style, mix.event, mix.city, mix.durationSeconds, mix.displayOrder, mix.homeFeatured, mix.homeDisplayOrder)
        )
    }

    data class MixUpdateRequest(
        val title: String,
        val year: Int,
        val style: String,
        val event: String,
        val city: String,
    )

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody body: MixUpdateRequest, req: HttpServletRequest): ResponseEntity<MixAdminResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = mixRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        mix.title = body.title
        mix.year = body.year
        mix.style = body.style
        mix.event = body.event
        mix.city = body.city
        val saved = mixRepository.save(mix)
        return ResponseEntity.ok(
            MixAdminResponse(saved.id, saved.publicId, saved.url, saved.coverUrl, saved.title, saved.year, saved.style, saved.event, saved.city, saved.durationSeconds, saved.displayOrder, saved.homeFeatured, saved.homeDisplayOrder)
        )
    }

    @PostMapping("/{id}/cover")
    fun updateCover(@PathVariable id: Long, @RequestParam("cover") cover: MultipartFile, req: HttpServletRequest): ResponseEntity<MixAdminResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = mixRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        if (mix.coverPublicId.isNotBlank()) {
            cloudinary.uploader().destroy(mix.coverPublicId, mapOf("resource_type" to "image"))
        }
        val result = cloudinary.uploader().upload(cover.bytes, mapOf("folder" to "dj-sabi/mix-covers", "resource_type" to "image"))
        mix.coverUrl = result["secure_url"] as String
        mix.coverPublicId = result["public_id"] as String
        val saved = mixRepository.save(mix)
        return ResponseEntity.ok(MixAdminResponse(saved.id, saved.publicId, saved.url, saved.coverUrl, saved.title, saved.year, saved.style, saved.event, saved.city, saved.durationSeconds, saved.displayOrder, saved.homeFeatured, saved.homeDisplayOrder))
    }

    @DeleteMapping("/{id}/cover")
    fun removeCover(@PathVariable id: Long, req: HttpServletRequest): ResponseEntity<MixAdminResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = mixRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        if (mix.coverPublicId.isNotBlank()) {
            cloudinary.uploader().destroy(mix.coverPublicId, mapOf("resource_type" to "image"))
        }
        mix.coverUrl = ""
        mix.coverPublicId = ""
        val saved = mixRepository.save(mix)
        return ResponseEntity.ok(MixAdminResponse(saved.id, saved.publicId, saved.url, saved.coverUrl, saved.title, saved.year, saved.style, saved.event, saved.city, saved.durationSeconds, saved.displayOrder, saved.homeFeatured, saved.homeDisplayOrder))
    }

    @PatchMapping("/{id}/featured")
    fun toggleFeatured(@PathVariable id: Long, req: HttpServletRequest): ResponseEntity<MixAdminResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = mixRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        mix.homeFeatured = !mix.homeFeatured
        val saved = mixRepository.save(mix)
        return ResponseEntity.ok(MixAdminResponse(saved.id, saved.publicId, saved.url, saved.coverUrl, saved.title, saved.year, saved.style, saved.event, saved.city, saved.durationSeconds, saved.displayOrder, saved.homeFeatured, saved.homeDisplayOrder))
    }

    data class HomeOrderRequest(val order: Int)

    @PatchMapping("/{id}/home-order")
    fun setHomeOrder(@PathVariable id: Long, @RequestBody body: HomeOrderRequest, req: HttpServletRequest): ResponseEntity<MixAdminResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = mixRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        mix.homeDisplayOrder = body.order
        val saved = mixRepository.save(mix)
        return ResponseEntity.ok(MixAdminResponse(saved.id, saved.publicId, saved.url, saved.coverUrl, saved.title, saved.year, saved.style, saved.event, saved.city, saved.durationSeconds, saved.displayOrder, saved.homeFeatured, saved.homeDisplayOrder))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, req: HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = mixRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        cloudinary.uploader().destroy(mix.publicId, mapOf("resource_type" to "video"))
        if (mix.coverPublicId.isNotBlank()) {
            cloudinary.uploader().destroy(mix.coverPublicId, mapOf("resource_type" to "image"))
        }
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
