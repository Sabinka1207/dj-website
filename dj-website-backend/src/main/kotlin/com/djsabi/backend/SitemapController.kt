package com.djsabi.backend

import com.djsabi.backend.repository.MixRepository
import com.djsabi.backend.repository.ExternalMixRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class SitemapController(
    private val mixRepository: MixRepository,
    private val externalMixRepository: ExternalMixRepository,
    @Value("\${app.site.url:https://dj-sabi.com}") private val siteUrl: String
) {
    @GetMapping("/api/sitemap.xml", produces = ["application/xml"])
    fun sitemap(): ResponseEntity<String> {
        val static = listOf(
            Triple("/", "weekly", "1.0"),
            Triple("/mixes", "weekly", "0.9"),
            Triple("/for-organisers", "monthly", "0.7"),
            Triple("/impressum", "yearly", "0.2"),
            Triple("/privacy", "yearly", "0.2"),
        )

        val sb = StringBuilder()
        sb.appendLine("""<?xml version="1.0" encoding="UTF-8"?>""")
        sb.appendLine("""<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">""")

        for ((path, freq, priority) in static) {
            sb.appendLine("  <url>")
            sb.appendLine("    <loc>$siteUrl$path</loc>")
            sb.appendLine("    <changefreq>$freq</changefreq>")
            sb.appendLine("    <priority>$priority</priority>")
            sb.appendLine("  </url>")
        }

        sb.appendLine("</urlset>")
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("application/xml"))
            .body(sb.toString())
    }
}
