package com.djsabi.backend

import com.fasterxml.jackson.databind.ObjectMapper
import com.google.analytics.data.v1beta.BetaAnalyticsDataClient
import com.google.analytics.data.v1beta.BetaAnalyticsDataSettings
import com.google.analytics.data.v1beta.DateRange
import com.google.analytics.data.v1beta.Dimension
import com.google.analytics.data.v1beta.Metric
import com.google.analytics.data.v1beta.RunReportRequest
import com.google.auth.oauth2.GoogleCredentials
import com.google.auth.oauth2.ServiceAccountCredentials
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.io.ByteArrayInputStream
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@RestController
@RequestMapping("/api/admin/analytics")
class AdminAnalyticsController(
    private val authService: AdminAuthService,
    @Value("\${GA4_PROPERTY_ID:543850299}") private val propertyId: String,
    @Value("\${GA4_SERVICE_ACCOUNT_JSON:{}}") private val serviceAccountJson: String
) {
    private val mapper = ObjectMapper()
    private val dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneId.of("Europe/Berlin"))

    private fun authorized(req: jakarta.servlet.http.HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    private fun buildClient(): BetaAnalyticsDataClient {
        val credentials = GoogleCredentials.fromStream(ByteArrayInputStream(serviceAccountJson.toByteArray()))
            .createScoped("https://www.googleapis.com/auth/analytics.readonly")
        val settings = BetaAnalyticsDataSettings.newBuilder()
            .setCredentialsProvider { credentials }
            .build()
        return BetaAnalyticsDataClient.create(settings)
    }

    private fun msToDate(ms: Long) = dateFmt.format(Instant.ofEpochMilli(ms))

    @GetMapping("/stats")
    fun stats(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<Any> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        return try {
            buildClient().use { client ->
                val range = DateRange.newBuilder().setStartDate(msToDate(startAt)).setEndDate(msToDate(endAt)).build()
                val request = RunReportRequest.newBuilder()
                    .setProperty("properties/$propertyId")
                    .addDateRanges(range)
                    .addMetrics(Metric.newBuilder().setName("totalUsers"))
                    .addMetrics(Metric.newBuilder().setName("screenPageViews"))
                    .addMetrics(Metric.newBuilder().setName("sessions"))
                    .addMetrics(Metric.newBuilder().setName("bounceRate"))
                    .addMetrics(Metric.newBuilder().setName("averageSessionDuration"))
                    .build()
                val response = client.runReport(request)
                val row = response.rowsList.firstOrNull()
                val visitors = row?.getMetricValues(0)?.value?.toLongOrNull() ?: 0L
                val pageviews = row?.getMetricValues(1)?.value?.toLongOrNull() ?: 0L
                val visits = row?.getMetricValues(2)?.value?.toLongOrNull() ?: 0L
                val bounceRate = row?.getMetricValues(3)?.value?.toDoubleOrNull() ?: 0.0
                val avgSession = row?.getMetricValues(4)?.value?.toDoubleOrNull() ?: 0.0
                ResponseEntity.ok(mapOf(
                    "visitors" to visitors,
                    "pageviews" to pageviews,
                    "visits" to visits,
                    "bounces" to (bounceRate * visits).toLong(),
                    "totaltime" to (avgSession * visits).toLong(),
                    "comparison" to mapOf("visitors" to 0, "pageviews" to 0, "visits" to 0, "bounces" to 0, "totaltime" to 0)
                ))
            }
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("error" to (e.message ?: "GA4 error")))
        }
    }

    @GetMapping("/pageviews")
    fun pageviews(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        @RequestParam(defaultValue = "day") unit: String,
        @RequestParam(defaultValue = "Europe/Berlin") timezone: String,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<Any> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        return try {
            buildClient().use { client ->
                val range = DateRange.newBuilder().setStartDate(msToDate(startAt)).setEndDate(msToDate(endAt)).build()
                val request = RunReportRequest.newBuilder()
                    .setProperty("properties/$propertyId")
                    .addDateRanges(range)
                    .addDimensions(Dimension.newBuilder().setName("date"))
                    .addMetrics(Metric.newBuilder().setName("screenPageViews"))
                    .build()
                val response = client.runReport(request)
                val points = response.rowsList.map { row ->
                    val d = row.getDimensionValues(0).value // YYYYMMDD
                    val formatted = "${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}"
                    mapOf("x" to formatted, "y" to (row.getMetricValues(0).value.toLongOrNull() ?: 0L))
                }.sortedBy { it["x"] as String }
                ResponseEntity.ok(mapOf("pageviews" to points))
            }
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("error" to (e.message ?: "GA4 error")))
        }
    }

    @GetMapping("/metrics")
    fun metrics(
        @RequestParam startAt: Long,
        @RequestParam endAt: Long,
        @RequestParam type: String,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<Any> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val dimension = when (type) {
            "country" -> "country"
            "device" -> "deviceCategory"
            "os" -> "operatingSystem"
            "browser" -> "browser"
            "url" -> "pagePath"
            "referrer" -> "sessionSource"
            "language" -> "language"
            else -> return ResponseEntity.badRequest().build()
        }
        return try {
            buildClient().use { client ->
                val range = DateRange.newBuilder().setStartDate(msToDate(startAt)).setEndDate(msToDate(endAt)).build()
                val request = RunReportRequest.newBuilder()
                    .setProperty("properties/$propertyId")
                    .addDateRanges(range)
                    .addDimensions(Dimension.newBuilder().setName(dimension))
                    .addMetrics(Metric.newBuilder().setName("sessions"))
                    .setLimit(10)
                    .build()
                val response = client.runReport(request)
                val result = response.rowsList.map { row ->
                    mapOf("x" to row.getDimensionValues(0).value, "y" to (row.getMetricValues(0).value.toLongOrNull() ?: 0L))
                }
                ResponseEntity.ok(result)
            }
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("error" to (e.message ?: "GA4 error")))
        }
    }
}
