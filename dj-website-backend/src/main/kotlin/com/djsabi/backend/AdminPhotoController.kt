package com.djsabi.backend

import com.cloudinary.Cloudinary
import com.djsabi.backend.model.Photo
import com.djsabi.backend.repository.PhotoRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

data class PhotoAdminResponse(val id: Long, val publicId: String, val url: String, val displayOrder: Int)
data class ReorderItem(val id: Long, val displayOrder: Int)

@RestController
@RequestMapping("/api/admin/photos")
class AdminPhotoController(
    private val photoRepository: PhotoRepository,
    private val authService: AdminAuthService,
    private val cloudinary: Cloudinary
) {

    private fun authorized(req: jakarta.servlet.http.HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    @GetMapping
    fun list(req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<List<PhotoAdminResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val photos = photoRepository.findAll().sortedBy { it.displayOrder }
            .map { PhotoAdminResponse(it.id, it.publicId, it.url, it.displayOrder) }
        return ResponseEntity.ok(photos)
    }

    @PostMapping("/upload")
    fun upload(
        @RequestParam("file") file: MultipartFile,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<PhotoAdminResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val result = cloudinary.uploader().upload(
            file.bytes,
            mapOf("folder" to "dj-sabi/gallery", "quality" to "auto", "fetch_format" to "auto")
        )
        val maxOrder = photoRepository.findAll().maxOfOrNull { it.displayOrder } ?: -1
        val photo = photoRepository.save(
            Photo(
                publicId = result["public_id"] as String,
                url = result["secure_url"] as String,
                displayOrder = maxOrder + 1
            )
        )
        return ResponseEntity.ok(PhotoAdminResponse(photo.id, photo.publicId, photo.url, photo.displayOrder))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val photo = photoRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        cloudinary.uploader().destroy(photo.publicId, mapOf<String, Any>())
        photoRepository.delete(photo)
        return ResponseEntity.noContent().build()
    }

    @Transactional
    @PutMapping("/reorder")
    fun reorder(
        @RequestBody items: List<ReorderItem>,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val photosById = photoRepository.findAllById(items.map { it.id }).associateBy { it.id }
        val updated = items.mapNotNull { item ->
            photosById[item.id]?.also { it.displayOrder = item.displayOrder }
        }
        photoRepository.saveAll(updated)
        return ResponseEntity.noContent().build()
    }

    @DeleteMapping
    fun deleteAll(req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val photos = photoRepository.findAll()
        photos.forEach { cloudinary.uploader().destroy(it.publicId, mapOf<String, Any>()) }
        photoRepository.deleteAll()
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/sync")
    fun syncFromCloudinary(req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<List<PhotoAdminResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val existingPublicIds = photoRepository.findAll().map { it.publicId }.toSet()
        @Suppress("UNCHECKED_CAST")
        val result = cloudinary.search()
            .expression("folder:dj-sabi/gallery")
            .maxResults(500)
            .execute() as Map<String, Any>
        @Suppress("UNCHECKED_CAST")
        val resources = result["resources"] as? List<Map<String, Any>> ?: emptyList()
        val maxOrder = photoRepository.findAll().maxOfOrNull { it.displayOrder } ?: -1
        val newPhotos = resources
            .filter { it["public_id"] as String !in existingPublicIds }
            .mapIndexed { i, r ->
                Photo(
                    publicId = r["public_id"] as String,
                    url = r["secure_url"] as String,
                    displayOrder = maxOrder + 1 + i
                )
            }
        val saved = photoRepository.saveAll(newPhotos)
        val all = photoRepository.findAll().sortedBy { it.displayOrder }
            .map { PhotoAdminResponse(it.id, it.publicId, it.url, it.displayOrder) }
        return ResponseEntity.ok(all)
    }
}
