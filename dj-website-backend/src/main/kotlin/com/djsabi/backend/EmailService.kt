package com.djsabi.backend

import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class EmailService(
    private val mailSender: JavaMailSender,
    @Value("\${spring.mail.username}") private val from: String,
    @Value("\${app.contact.recipient-email}") private val recipient: String,
) {
    fun sendContactEmail(req: ContactRequest) {
        val receivedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
        val msg = SimpleMailMessage()
        msg.setFrom(from)
        msg.setTo(recipient)
        msg.replyTo = req.email
        msg.subject = "New booking request from ${req.name}"
        msg.text = """
            New booking inquiry received via dj-sabi.com
            Received: $receivedAt

            Name:    ${req.name}
            Email:   ${req.email}
            Event:   ${req.event}
            Date:    ${req.date.ifBlank { "—" }}

            Message:
            ${req.message}
        """.trimIndent()
        mailSender.send(msg)
    }
}
