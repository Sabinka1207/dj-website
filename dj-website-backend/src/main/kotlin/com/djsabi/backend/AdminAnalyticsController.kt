package com.djsabi.backend

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
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
    private val mapper = ObjectMapper()

    private fun authorized(req: jakarta.servlet.http.HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    private fun umamiGet(path: String): Pair<Int, String> {
        val request = HttpRequest.newBuilder()
            .uri(URI.create("$baseUrl$path"))
            .header("x-umami-api-key", apiToken)
            .header("Accept", "application/json")
            .GET()
            .build()
        val resp = client.send(request, HttpResponse.BodyHandlers.ofString())
        return resp.statusCode() to resp.body()
    }

    // Umami Cloud API returns {field: {value: N, change: N}} — flatten to {field: N, comparison: {...}}
    private fun flattenStats(json: String): String {
        val node = mapper.readTree(json)
        if (!node.isObject || !node.has("visitors")) return json
        val fields = listOf("pageviews", "visitors", "visits", "bounces", "totaltime")
        val flat = mapper.createObjectNode()
        val comparison = mapper.createObjectNode()
        for (f in fields) {
            val child = node.get(f)
            if (child != null && child.isObject) {
                flat.put(f, child.path("value").asLong(0))
                comparison.put(f, child.path("change").asLong(0))
            } else if (child != null) {
                flat.set<JsonNode>(f, child)
                comparison.put(f, 0)
            }
        }
        flat.set<JsonNode>("comparison", comparison)
        return mapper.writeValueAsString(flat)
    }

    @GetMapping("/stats")
    fun stats(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<String> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val (status, body) = umamiGet("/websites/$websiteId/stats?startAt=$startAt&endAt=$endAt")
        if (status != 200) return ResponseEntity.status(status).header("Content-Type", "application/json").body(body)
        return ResponseEntity.ok().header("Content-Type", "application/json").body(flattenStats(body))
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
        val (status, body) = umamiGet("/websites/$websiteId/pageviews?startAt=$startAt&endAt=$endAt&unit=$unit&timezone=${java.net.URLEncoder.encode(timezone, "UTF-8")}")
        return ResponseEntity.status(status).header("Content-Type", "application/json").body(body)
    }

    @GetMapping("/metrics")
    fun metrics(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        @RequestParam type: String,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<String> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val (status, body) = umamiGet("/websites/$websiteId/metrics?startAt=$startAt&endAt=$endAt&type=$type&limit=10")
        return ResponseEntity.status(status).header("Content-Type", "application/json").body(body)
    }
}
