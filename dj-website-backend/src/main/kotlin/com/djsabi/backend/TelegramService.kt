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
class TelegramService(
    @Value("\${app.telegram.bot-token}") private val botToken: String,
    @Value("\${app.telegram.chat-id}") private val chatId: String,
) {
    private val rest = RestTemplate()

    fun sendNotification(req: ContactRequest) {
        val receivedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm"))
        val url = "https://api.telegram.org/bot$botToken/sendMessage"
        val body = mapOf(
            "chat_id" to chatId,
            "text" to "You got a new email from your website contact form\n$receivedAt",
        )
        val headers = HttpHeaders().apply { contentType = MediaType.APPLICATION_JSON }
        rest.postForObject(url, HttpEntity(body, headers), String::class.java)
    }
}
