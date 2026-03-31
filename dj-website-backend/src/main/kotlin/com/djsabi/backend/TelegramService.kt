package com.djsabi.backend

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

@Service
class TelegramService(
    @Value("\${app.telegram.bot-token}") private val botToken: String,
    @Value("\${app.telegram.chat-id}") private val chatId: String,
    @Value("\${app.site.url:https://dj-sabi.com}") private val siteUrl: String,
) {
    private val rest = RestTemplate()
    private val berlin = ZoneId.of("Europe/Berlin")
    private val fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")

    fun sendNotification(req: ContactRequest) {
        val receivedAt = ZonedDateTime.now(berlin).format(fmt)
        val lines = mutableListOf(
            "📩 New booking inquiry — $receivedAt",
            "",
            "👤 ${req.name}",
            "✉️ ${req.email}",
        )
        if (req.event.isNotBlank()) lines += "🎉 ${req.event}"
        if (req.date.isNotBlank())  lines += "📅 ${req.date}"
        if (req.message.isNotBlank()) {
            lines += ""
            lines += req.message
        }
        lines += ""
        lines += "$siteUrl/admin/bookings"

        val url = "https://api.telegram.org/bot$botToken/sendMessage"
        val body = mapOf("chat_id" to chatId, "text" to lines.joinToString("\n"))
        val headers = HttpHeaders().apply { contentType = MediaType.APPLICATION_JSON }
        rest.postForObject(url, HttpEntity(body, headers), String::class.java)
    }
}
