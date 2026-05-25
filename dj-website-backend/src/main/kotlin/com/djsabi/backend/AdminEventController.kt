package com.djsabi.backend

import com.cloudinary.Cloudinary
import com.djsabi.backend.model.Event
import com.djsabi.backend.repository.EventRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

data class EventRequest(
    val date: String,
    val venue: String,
    val city: String,
    val country: String,
    val description: String
)

private fun Event.toResponse() =
    EventResponse(id.toString(), date, venue, city, country, description, posterUrl, posterFocusX, posterFocusY)

@RestController
@RequestMapping("/api/admin/events")
class AdminEventController(
    private val eventRepository: EventRepository,
    private val cloudinary: Cloudinary,
    private val authService: AdminAuthService
) {

    private fun authorized(req: HttpServletRequest): Boolean {
        val token = req.getHeader("Authorization")?.removePrefix("Bearer ")?.trim() ?: return false
        return authService.isValid(token)
    }

    private fun authorized(auth: String?): Boolean {
        val token = auth?.removePrefix("Bearer ")?.trim() ?: return false
        return authService.isValid(token)
    }

    @GetMapping
    fun list(@RequestHeader("Authorization", required = false) auth: String?): ResponseEntity<List<EventResponse>> {
        if (!authorized(auth)) return ResponseEntity.status(401).build()
        val events = eventRepository.findAll().sortedBy { it.date }.map { it.toResponse() }
        return ResponseEntity.ok(events)
    }

    @PostMapping
    fun create(
        @RequestHeader("Authorization", required = false) auth: String?,
        @RequestBody req: EventRequest
    ): ResponseEntity<EventResponse> {
        if (!authorized(auth)) return ResponseEntity.status(401).build()
        val saved = eventRepository.save(
            Event(date = req.date, venue = req.venue, city = req.city, country = req.country, description = req.description)
        )
        return ResponseEntity.ok(saved.toResponse())
    }

    @PutMapping("/{id}")
    fun update(
        @RequestHeader("Authorization", required = false) auth: String?,
        @PathVariable id: Long,
        @RequestBody req: EventRequest
    ): ResponseEntity<EventResponse> {
        if (!authorized(auth)) return ResponseEntity.status(401).build()
        val existing = eventRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        existing.date = req.date
        existing.venue = req.venue
        existing.city = req.city
        existing.country = req.country
        existing.description = req.description
        val saved = eventRepository.save(existing)
        return ResponseEntity.ok(saved.toResponse())
    }

    @PostMapping("/{id}/poster")
    fun uploadPoster(
        @PathVariable id: Long,
        @RequestParam("poster") poster: MultipartFile,
        req: HttpServletRequest
    ): ResponseEntity<EventResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val event = eventRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        if (event.posterPublicId.isNotBlank()) {
            cloudinary.uploader().destroy(event.posterPublicId, mapOf("resource_type" to "image"))
        }
        val result = cloudinary.uploader().upload(
            poster.bytes,
            mapOf("folder" to "dj-sabi/event-posters", "resource_type" to "image")
        )
        event.posterUrl = result["secure_url"] as String
        event.posterPublicId = result["public_id"] as String
        val saved = eventRepository.save(event)
        return ResponseEntity.ok(saved.toResponse())
    }

    @DeleteMapping("/{id}/poster")
    fun removePoster(
        @PathVariable id: Long,
        req: HttpServletRequest
    ): ResponseEntity<EventResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val event = eventRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        if (event.posterPublicId.isNotBlank()) {
            cloudinary.uploader().destroy(event.posterPublicId, mapOf("resource_type" to "image"))
        }
        event.posterUrl = ""
        event.posterPublicId = ""
        val saved = eventRepository.save(event)
        return ResponseEntity.ok(saved.toResponse())
    }

    data class PosterFocusRequest(val focusX: Int, val focusY: Int)

    @PatchMapping("/{id}/poster-focus")
    fun updatePosterFocus(
        @PathVariable id: Long,
        @RequestBody req: PosterFocusRequest,
        httpReq: HttpServletRequest
    ): ResponseEntity<EventResponse> {
        if (!authorized(httpReq)) return ResponseEntity.status(401).build()
        val event = eventRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        event.posterFocusX = req.focusX.coerceIn(0, 100)
        event.posterFocusY = req.focusY.coerceIn(0, 100)
        val saved = eventRepository.save(event)
        return ResponseEntity.ok(saved.toResponse())
    }

    @DeleteMapping("/{id}")
    fun delete(
        @RequestHeader("Authorization", required = false) auth: String?,
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        if (!authorized(auth)) return ResponseEntity.status(401).build()
        val event = eventRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        if (event.posterPublicId.isNotBlank()) {
            cloudinary.uploader().destroy(event.posterPublicId, mapOf("resource_type" to "image"))
        }
        eventRepository.delete(event)
        return ResponseEntity.noContent().build()
    }
}
