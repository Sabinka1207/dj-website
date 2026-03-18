package com.djsabi.backend

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
) {
    private val log = LoggerFactory.getLogger(ContactController::class.java)

    @PostMapping("/contact")
    fun contact(@RequestBody req: ContactRequest): ResponseEntity<Void> {
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
