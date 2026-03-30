package com.djsabi.backend

import com.djsabi.backend.model.BookingRequest
import com.djsabi.backend.repository.BookingRequestRepository
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class ContactController(
    private val emailService: EmailService,
    private val telegramService: TelegramService,
    private val bookingRequestRepository: BookingRequestRepository,
) {
    private val log = LoggerFactory.getLogger(ContactController::class.java)

    @PostMapping("/contact")
    fun contact(@RequestBody req: ContactRequest): ResponseEntity<Void> {
        try {
            bookingRequestRepository.save(
                BookingRequest(name = req.name, email = req.email, event = req.event, date = req.date, message = req.message, source = req.source, language = req.language)
            )
        } catch (e: Exception) {
            log.error("Failed to save booking request", e)
        }
        try {
            emailService.sendContactEmail(req)
        } catch (e: Exception) {
            log.error("Failed to send contact email", e)
        }
        try {
            telegramService.sendNotification(req)
        } catch (e: Exception) {
            log.error("Failed to send Telegram notification", e)
        }
        return ResponseEntity.ok().build()
    }
}
