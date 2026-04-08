package com.djsabi.backend

import com.djsabi.backend.model.ExternalMix
import com.djsabi.backend.repository.ExternalMixRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class ExternalMixRequest(
    val embedUrl: String,
    val title: String,
    val year: Int,
    val style: String,
    val event: String,
    val city: String
)

@RestController
@RequestMapping("/api/admin/external-mixes")
class AdminExternalMixController(
    private val repo: ExternalMixRepository,
    private val authService: AdminAuthService
) {

    private fun authorized(req: HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    private fun detectType(url: String) = when {
        url.contains("youtube.com") || url.contains("youtu.be") -> "youtube"
        url.contains("soundcloud.com") -> "soundcloud"
        url.contains("mixcloud.com") -> "mixcloud"
        else -> "other"
    }

    private fun toResponse(m: ExternalMix) =
        ExternalMixResponse(m.id, m.embedUrl, m.embedType, m.title, m.year, m.style, m.event, m.city)

    @GetMapping
    fun list(req: HttpServletRequest): ResponseEntity<List<ExternalMixResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        return ResponseEntity.ok(repo.findAllByOrderByYearDesc().map { toResponse(it) })
    }

    @PostMapping
    fun create(@RequestBody body: ExternalMixRequest, req: HttpServletRequest): ResponseEntity<ExternalMixResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = repo.save(
            ExternalMix(
                embedUrl = body.embedUrl.trim(),
                embedType = detectType(body.embedUrl),
                title = body.title.trim(),
                year = body.year,
                style = body.style.trim(),
                event = body.event.trim(),
                city = body.city.trim()
            )
        )
        return ResponseEntity.ok(toResponse(mix))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody body: ExternalMixRequest, req: HttpServletRequest): ResponseEntity<ExternalMixResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val mix = repo.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        mix.embedUrl = body.embedUrl.trim()
        mix.embedType = detectType(body.embedUrl)
        mix.title = body.title.trim()
        mix.year = body.year
        mix.style = body.style.trim()
        mix.event = body.event.trim()
        mix.city = body.city.trim()
        return ResponseEntity.ok(toResponse(repo.save(mix)))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, req: HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (!repo.existsById(id)) return ResponseEntity.notFound().build()
        repo.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
