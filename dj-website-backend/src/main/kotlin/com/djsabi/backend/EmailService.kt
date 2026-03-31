package com.djsabi.backend

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@Service
class EmailService(
    @Value("\${app.resend.api-key}") private val apiKey: String,
    @Value("\${app.contact.recipient-email}") private val recipient: String,
) {
    private val rest = RestTemplate()

    fun sendContactEmail(req: ContactRequest) {
        val receivedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
        val body = mapOf(
            "from" to "DJ Sabi Website <noreply@dj-sabi.com>",
            "to" to listOf(recipient),
            "reply_to" to req.email,
            "subject" to "New booking request from ${req.name}",
            "text" to """
                New booking inquiry received via dj-sabi.com
                Received: $receivedAt

                Name:    ${req.name}
                Email:   ${req.email}
                Event:   ${req.event}
                Date:    ${req.date.ifBlank { "—" }}

                Message:
                ${req.message}
            """.trimIndent()
        )
        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(apiKey)
        }
        rest.postForObject("https://api.resend.com/emails", HttpEntity(body, headers), String::class.java)
    }

    fun sendReply(toEmail: String, toName: String, message: String) {
        val body = mapOf(
            "from" to "DJ Sabi <noreply@dj-sabi.com>",
            "to" to listOf(toEmail),
            "reply_to" to recipient,
            "subject" to "Re: Your booking inquiry",
            "text" to message
        )
        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(apiKey)
        }
        rest.postForObject("https://api.resend.com/emails", HttpEntity(body, headers), String::class.java)
    }
}
