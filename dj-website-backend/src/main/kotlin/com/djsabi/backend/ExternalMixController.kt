package com.djsabi.backend

import com.djsabi.backend.repository.ExternalMixRepository
import org.springframework.web.bind.annotation.*

data class ExternalMixResponse(
    val id: Long,
    val embedUrl: String,
    val embedType: String,
    val title: String,
    val year: Int,
    val style: String,
    val event: String,
    val city: String,
    val homeFeatured: Boolean
)

@RestController
@RequestMapping("/api/external-mixes")
class ExternalMixController(private val repo: ExternalMixRepository) {

    private fun toResponse(m: com.djsabi.backend.model.ExternalMix) =
        ExternalMixResponse(m.id, m.embedUrl, m.embedType, m.title, m.year, m.style, m.event, m.city, m.homeFeatured)

    @GetMapping
    fun list() = repo.findAllByOrderByYearDesc().map { toResponse(it) }

    @GetMapping("/featured")
    fun featured() = repo.findByHomeFeaturedTrueOrderByYearDesc().map { toResponse(it) }
}
