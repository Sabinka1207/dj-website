package com.djsabi.backend

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import io.github.bucket4j.Refill
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap

@Component
class RateLimitInterceptor : HandlerInterceptor {

    private val buckets = ConcurrentHashMap<String, Bucket>()

    private fun newBucket(): Bucket = Bucket.builder()
        .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1))))
        .build()

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        val ip = (request.getHeader("X-Forwarded-For")?.split(",")?.firstOrNull()?.trim())
            ?: request.remoteAddr
        val bucket = buckets.getOrPut(ip) { newBucket() }

        return if (bucket.tryConsume(1)) {
            true
        } else {
            response.status = 429
            response.contentType = "application/json"
            response.writer.write("""{"error":"Too many requests. Please try again later."}""")
            false
        }
    }
}
