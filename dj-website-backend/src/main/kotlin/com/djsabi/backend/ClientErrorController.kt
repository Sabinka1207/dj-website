package com.djsabi.backend

import com.fasterxml.jackson.databind.JsonNode
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.concurrent.ConcurrentHashMap

data class ClientErrorRequest(
    // backward-compatible legacy fields
    val message: String = "",
    val stack: String = "",
    val url: String = "",
    val userAgent: String = "",
    // enriched fields
    val errorId: String = "",
    val errorName: String = "",
    val errorMessage: String = "",
    val errorKind: String = "",
    val severity: String = "",
    val action: String = "",
    val possibleCause: String = "",
    val stackIsMinified: Boolean = false,
    val sourceFile: String = "",
    val line: Int? = null,
    val column: Int? = null,
    val lastFetchErrorBody: String = "",
    val previousUrl: String = "",
    val referrer: String = "",
    val timestampIso: String = "",
    val timestampLocal: String = "",
    val appEnv: String = "",
    val appVersion: String = "",
    val gitCommit: String = "",
    val browserName: String = "",
    val browserVersion: String = "",
    val os: String = "",
    val deviceType: String = "",
    val screenResolution: String = "",
    val viewportSize: String = "",
    val language: String = "",
    val timezone: String = "",
    val online: Boolean = true,
    val sessionId: String = "",
    val pageLoadMs: Long? = null,
    val timeSinceOpenMs: Long? = null,
    val breadcrumbs: List<JsonNode> = emptyList(),
)

private data class OccurrenceRecord(
    val firstSeen: Instant,
    var lastSeen: Instant,
    var count: Int,
)

@RestController
@RequestMapping("/api")
class ClientErrorController(private val telegram: TelegramService) {

    // key → occurrence record (survives across requests in this process)
    private val occurrences = ConcurrentHashMap<String, OccurrenceRecord>()

    // Rate limit: max 10 Telegram alerts per 10-minute window
    private var windowSlot = 0
    private var windowCount = 0

    private val berlin = ZoneId.of("Europe/Berlin")
    private val fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss").withZone(berlin)

    @PostMapping("/client-error")
    @Synchronized
    fun report(@RequestBody body: ClientErrorRequest): ResponseEntity<Void> {
        val effectiveMessage = body.errorMessage.ifBlank { body.message }
        if (effectiveMessage.isBlank()) return ResponseEntity.badRequest().build()

        val dedupKey = "${body.errorName}:${effectiveMessage.take(120)}"
        val now = Instant.now()

        // Update occurrence stats unconditionally
        val rec = occurrences.compute(dedupKey) { _, existing ->
            if (existing == null) {
                OccurrenceRecord(firstSeen = now, lastSeen = now, count = 1)
            } else {
                existing.lastSeen = now
                existing.count++
                existing
            }
        }!!

        // Only send Telegram alert on first occurrence or every 5 minutes per key
        val isFirstOccurrence = rec.count == 1
        val minutesSinceLast = if (rec.count > 1)
            Duration.between(rec.firstSeen, now).toMinutes() else 0L

        val shouldAlert = isFirstOccurrence || minutesSinceLast >= 5
        if (!shouldAlert) return ResponseEntity.ok().build()

        // Rate limit
        val slot = (System.currentTimeMillis() / 600_000).toInt()
        if (slot != windowSlot) { windowSlot = slot; windowCount = 0 }
        if (++windowCount > 10) return ResponseEntity.ok().build()

        val text = buildTelegramMessage(body, effectiveMessage, rec)
        runCatching { telegram.sendClientErrorAlert(text) }
        return ResponseEntity.ok().build()
    }

    private fun buildTelegramMessage(
        b: ClientErrorRequest,
        effectiveMessage: String,
        rec: OccurrenceRecord,
    ): String {
        val isEnriched = b.errorName.isNotBlank()

        return buildString {
            // ── header ─────────────────────────────────────────────────────
            val envTag = when {
                b.appEnv == "production" -> "🔴 PROD"
                b.appEnv.isNotBlank()    -> "🟡 ${b.appEnv.uppercase()}"
                else                     -> "🔴 PROD"
            }
            val severityLabel = when (b.severity.lowercase()) {
                "critical" -> "🔴 Critical"
                "high"     -> "🟠 High"
                "medium"   -> "🟡 Medium"
                "low"      -> "🟢 Low"
                else       -> ""
            }
            val header = buildString {
                append("🚨 <b>$envTag — Frontend JS Error</b>")
                if (severityLabel.isNotEmpty()) append("  $severityLabel")
                if (b.errorId.isNotBlank()) append("\n🔑 ID: <code>${esc(b.errorId)}</code>")
            }
            appendLine(header)

            // ── occurrence stats ───────────────────────────────────────────
            if (rec.count > 1) {
                appendLine()
                appendLine("📊 <b>Occurrence</b>")
                appendLine("Count: <b>${rec.count}</b>")
                appendLine("First seen: ${fmt.format(rec.firstSeen)}")
                appendLine("Last seen:  ${fmt.format(rec.lastSeen)}")
            }

            // ── error ──────────────────────────────────────────────────────
            appendLine()
            appendLine("❌ <b>Error</b>")
            if (isEnriched) {
                if (b.errorName.isNotBlank()) appendLine("Name: <code>${esc(b.errorName)}</code>")
                appendLine("Message: <code>${esc(effectiveMessage.take(300))}</code>")
                if (b.errorKind.isNotBlank()) appendLine("Type: <code>${esc(b.errorKind)}</code>")
                if (b.sourceFile.isNotBlank()) appendLine("File: <code>${esc(b.sourceFile.take(120))}</code>")
                if (b.line != null) appendLine("Line: <code>${b.line}</code>  Col: <code>${b.column ?: "?"}</code>")
                if (b.stackIsMinified) appendLine("⚠️ <i>Stack trace is minified — original source not resolvable at runtime. Source maps are available at dist/assets/*.js.map.</i>")
            } else {
                appendLine("Message: <code>${esc(effectiveMessage.take(300))}</code>")
            }

            // ── possible cause + action ────────────────────────────────────
            if (b.possibleCause.isNotBlank() || b.action.isNotBlank()) {
                appendLine()
                appendLine("🧠 <b>Possible Cause</b>")
                if (b.possibleCause.isNotBlank()) appendLine(esc(b.possibleCause))
                if (b.action.isNotBlank()) appendLine("✅ <b>Recommended action:</b> ${esc(b.action)}")
            }

            // ── environment ────────────────────────────────────────────────
            appendLine()
            appendLine("🌐 <b>Environment</b>")
            val urlVal = b.url.ifBlank { "unknown" }
            appendLine("URL: <code>${esc(urlVal.take(200))}</code>")
            if (b.previousUrl.isNotBlank()) appendLine("Previous: <code>${esc(b.previousUrl.take(200))}</code>")
            if (b.referrer.isNotBlank()) appendLine("Referrer: <code>${esc(b.referrer.take(200))}</code>")
            val ts = b.timestampLocal.ifBlank { b.timestampIso }
            if (ts.isNotBlank()) appendLine("Time: $ts")
            if (b.appVersion.isNotBlank() && b.appVersion != "unknown") appendLine("Version: <code>${esc(b.appVersion)}</code>")
            if (b.gitCommit.isNotBlank() && b.gitCommit != "unknown") appendLine("Commit: <code>${esc(b.gitCommit)}</code>")

            // ── browser / device ───────────────────────────────────────────
            if (isEnriched) {
                appendLine()
                appendLine("🌍 <b>Browser &amp; Device</b>")
                if (b.browserName.isNotBlank()) appendLine("Browser: ${esc(b.browserName)} ${esc(b.browserVersion)}")
                if (b.os.isNotBlank()) appendLine("OS: ${esc(b.os)}")
                appendLine("Device: ${esc(b.deviceType.ifBlank { "Unknown" })}")
                if (b.screenResolution.isNotBlank()) appendLine("Screen: ${esc(b.screenResolution)}  Viewport: ${esc(b.viewportSize)}")
                if (b.language.isNotBlank()) appendLine("Language: ${esc(b.language)}  TZ: ${esc(b.timezone)}")
                appendLine("Online: ${if (b.online) "✅" else "❌ offline"}")
            } else if (b.userAgent.isNotBlank()) {
                appendLine()
                appendLine("🌍 <b>Browser</b>")
                appendLine("<code>${esc(b.userAgent.take(200))}</code>")
            }

            // ── session ────────────────────────────────────────────────────
            if (isEnriched && b.sessionId.isNotBlank()) {
                appendLine()
                appendLine("👤 <b>Session</b>")
                appendLine("ID: <code>${esc(b.sessionId)}</code>")
                if (b.pageLoadMs != null) appendLine("Page load: ${b.pageLoadMs}ms")
                if (b.timeSinceOpenMs != null) {
                    val sec = b.timeSinceOpenMs / 1000
                    appendLine("Time on page: ${if (sec < 60) "${sec}s" else "${sec / 60}m ${sec % 60}s"}")
                }
            }

            // ── last failed API response body ──────────────────────────────
            if (b.lastFetchErrorBody.isNotBlank()) {
                appendLine()
                appendLine("🔌 <b>Last API Error Response</b>")
                appendLine("<pre>${esc(b.lastFetchErrorBody.take(400))}</pre>")
            }

            // ── stack trace ────────────────────────────────────────────────
            val stackVal = b.stack.ifBlank { null }
            if (stackVal != null) {
                appendLine()
                appendLine("📚 <b>Stack Trace</b>")
                appendLine("<pre>${esc(stackVal.take(1200))}</pre>")
            }

            // ── breadcrumbs ────────────────────────────────────────────────
            if (b.breadcrumbs.isNotEmpty()) {
                appendLine()
                appendLine("👣 <b>Breadcrumbs (last ${b.breadcrumbs.size})</b>")
                b.breadcrumbs.takeLast(20).forEach { crumb ->
                    val kind = crumb.path("kind").asText("?")
                    val msg  = crumb.path("message").asText("")
                    val ts2  = crumb.path("ts").asLong(0)
                    val elapsed = if (ts2 > 0) {
                        val diffSec = (System.currentTimeMillis() - ts2) / 1000
                        "−${diffSec}s"
                    } else ""
                    val icon = when (kind) {
                        "click"          -> "🖱"
                        "fetch"          -> "🌐"
                        "fetch_error"    -> "💥"
                        "navigation",
                        "route"          -> "🔀"
                        "visibility"     -> "👁"
                        "console_warn"   -> "⚠️"
                        "console_error"  -> "🔴"
                        else             -> "•"
                    }
                    appendLine("$icon [$elapsed] ${esc(msg.take(80))}")
                }
            }
        }.trim().take(4096)
    }

    private fun esc(s: String): String = s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
}
