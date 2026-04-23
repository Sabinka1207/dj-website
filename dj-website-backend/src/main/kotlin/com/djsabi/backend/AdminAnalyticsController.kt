package com.djsabi.backend

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

@RestController
@RequestMapping("/api/admin/analytics")
class AdminAnalyticsController(
    private val authService: AdminAuthService,
    @Value("\${UMAMI_API_TOKEN:placeholder}") private val apiToken: String,
    @Value("\${UMAMI_WEBSITE_ID:482b7ced-f627-4fbf-8db8-ab48eaa71449}") private val websiteId: String
) {
    private val client = HttpClient.newHttpClient()
    private val baseUrl = "https://api.umami.is/v1"

    private fun authorized(req: jakarta.servlet.http.HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    private fun umamiGet(path: String): String {
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl$path"))
            .header("x-umami-api-key", apiToken)
            .header("Accept", "application/json")
            .GET()
            .build()
        return client.send(request, HttpResponse.BodyHandlers.ofString()).body()
    }

    @GetMapping("/stats")
    fun stats(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<String> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val body = umamiGet("/websites/$websiteId/stats?startAt=$startAt&endAt=$endAt")
        return ResponseEntity.ok().header("Content-Type", "application/json").body(body)
    }

    @GetMapping("/pageviews")
    fun pageviews(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        @RequestParam(defaultValue = "day") unit: String,
        @RequestParam(defaultValue = "de") timezone: String,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<String> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val body = umamiGet("/websites/$websiteId/pageviews?startAt=$startAt&endAt=$endAt&unit=$unit&timezone=${java.net.URLEncoder.encode(timezone, "UTF-8")}")
        return ResponseEntity.ok().header("Content-Type", "application/json").body(body)
    }

    @GetMapping("/metrics")
    fun metrics(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        @RequestParam type: String,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<String> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val body = umamiGet("/websites/$websiteId/metrics?startAt=$startAt&endAt=$endAt&type=$type&limit=10")
        return ResponseEntity.ok().header("Content-Type", "application/json").body(body)
    }
}
