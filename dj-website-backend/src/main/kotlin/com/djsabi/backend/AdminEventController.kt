package com.djsabi.backend

import com.djsabi.backend.model.Event
import com.djsabi.backend.repository.EventRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class EventRequest(
    val date: String,
    val venue: String,
    val city: String,
    val country: String,
    val description: String
)

@RestController
@RequestMapping("/api/admin/events")
class AdminEventController(
    private val eventRepository: EventRepository,
    private val authService: AdminAuthService
) {

    private fun authorized(auth: String?): Boolean {
        val token = auth?.removePrefix("Bearer ")?.trim() ?: return false
        return authService.isValid(token)
    }

    @GetMapping
    fun list(@RequestHeader("Authorization", required = false) auth: String?): ResponseEntity<List<EventResponse>> {
        if (!authorized(auth)) return ResponseEntity.status(401).build()
        val events = eventRepository.findAll()
            .sortedBy { it.date }
            .map { EventResponse(it.id.toString(), it.date, it.venue, it.city, it.country, it.description) }
        return ResponseEntity.ok(events)
    }

    @PostMapping
    fun create(
        @RequestHeader("Authorization", required = false) auth: String?,
        @RequestBody req: EventRequest
    ): ResponseEntity<EventResponse> {
        if (!authorized(auth)) return ResponseEntity.status(401).build()
        val saved = eventRepository.save(Event(date = req.date, venue = req.venue, city = req.city, country = req.country, description = req.description))
        return ResponseEntity.ok(EventResponse(saved.id.toString(), saved.date, saved.venue, saved.city, saved.country, saved.description))
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
        return ResponseEntity.ok(EventResponse(saved.id.toString(), saved.date, saved.venue, saved.city, saved.country, saved.description))
    }

    @DeleteMapping("/{id}")
    fun delete(
        @RequestHeader("Authorization", required = false) auth: String?,
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        if (!authorized(auth)) return ResponseEntity.status(401).build()
        if (!eventRepository.existsById(id)) return ResponseEntity.notFound().build()
        eventRepository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
