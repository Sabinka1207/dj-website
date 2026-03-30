package com.djsabi.backend

import com.djsabi.backend.repository.BookingRequestRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.format.DateTimeFormatter

data class BookingRequestResponse(
    val id: Long,
    val name: String,
    val email: String,
    val event: String,
    val date: String,
    val message: String,
    val source: String,
    val language: String,
    val status: String,
    val reply: String?,
    val submittedAt: String
)

data class BookingReplyRequest(val message: String)

@RestController
@RequestMapping("/api/admin/bookings")
class AdminBookingController(
    private val bookingRequestRepository: BookingRequestRepository,
    private val authService: AdminAuthService,
    private val emailService: EmailService
) {
    private val formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")

    private fun authorized(req: jakarta.servlet.http.HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    @GetMapping("/unread-count")
    fun unreadCount(req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Map<String, Long>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        return ResponseEntity.ok(mapOf("count" to bookingRequestRepository.countByStatus("new")))
    }

    @GetMapping
    fun list(req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<List<BookingRequestResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val bookings = bookingRequestRepository.findAll()
            .sortedByDescending { it.submittedAt }
            .map { BookingRequestResponse(it.id, it.name, it.email, it.event, it.date, it.message, it.source, it.language, it.status, it.reply, it.submittedAt.format(formatter)) }
        return ResponseEntity.ok(bookings)
    }

    @PatchMapping("/{id}/read")
    fun markRead(@PathVariable id: Long, req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (!bookingRequestRepository.existsById(id)) return ResponseEntity.notFound().build()
        bookingRequestRepository.updateStatus(id, "read")
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/{id}/unread")
    fun markUnread(@PathVariable id: Long, req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (!bookingRequestRepository.existsById(id)) return ResponseEntity.notFound().build()
        bookingRequestRepository.updateStatus(id, "new")
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/reply")
    fun reply(@PathVariable id: Long, @RequestBody body: BookingReplyRequest, req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val booking = bookingRequestRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        emailService.sendReply(booking.email, booking.name, body.message)
        bookingRequestRepository.updateReply(id, body.message)
        return ResponseEntity.noContent().build()
    }

    @PatchMapping("/{id}/answered")
    fun markAnswered(@PathVariable id: Long, req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (!bookingRequestRepository.existsById(id)) return ResponseEntity.notFound().build()
        bookingRequestRepository.updateStatus(id, "answered")
        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (!bookingRequestRepository.existsById(id)) return ResponseEntity.notFound().build()
        bookingRequestRepository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
