package com.djsabi.backend

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

data class ClientErrorRequest(
    val message: String = "",
    val stack: String = "",
    val url: String = "",
    val userAgent: String = "",
)

@RestController
@RequestMapping("/api")
class ClientErrorController(private val telegram: TelegramService) {

    // Simple global counter: max 10 alerts per 10-minute window to avoid floods
    private val windowStart = AtomicInteger(0)
    private val windowCount = AtomicInteger(0)
    private val reported = ConcurrentHashMap.newKeySet<String>()

    @PostMapping("/client-error")
    fun report(@RequestBody body: ClientErrorRequest): ResponseEntity<Void> {
        val msg = body.message.take(200)
        if (msg.isBlank()) return ResponseEntity.badRequest().build()

        // Deduplicate identical errors (same message in same process lifetime)
        val key = msg.hashCode().toString()
        if (!reported.add(key)) return ResponseEntity.ok().build()

        // Rate limit: max 10 per 10 minutes globally
        val nowSlot = (System.currentTimeMillis() / 600_000).toInt()
        if (windowStart.getAndSet(nowSlot) != nowSlot) windowCount.set(0)
        if (windowCount.incrementAndGet() > 10) return ResponseEntity.ok().build()

        val detail = buildString {
            append("*URL:* `${body.url.take(200)}`\n")
            if (body.message.isNotBlank()) append("*Message:* ${body.message.take(300)}\n")
            if (body.stack.isNotBlank()) {
                append("\n```\n")
                append(body.stack.take(1500))
                append("\n```")
            }
        }
        runCatching { telegram.sendErrorAlert("Frontend JS error", detail) }
        return ResponseEntity.ok().build()
    }
}
