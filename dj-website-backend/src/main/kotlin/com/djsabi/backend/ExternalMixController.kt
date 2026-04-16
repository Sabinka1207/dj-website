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
    val homeFeatured: Boolean,
    val homeDisplayOrder: Int
)

@RestController
@RequestMapping("/api/external-mixes")
class ExternalMixController(private val repo: ExternalMixRepository) {

    private fun toResponse(m: com.djsabi.backend.model.ExternalMix) =
        ExternalMixResponse(m.id, m.embedUrl, m.embedType, m.title, m.year, m.style, m.event, m.city, m.homeFeatured, m.homeDisplayOrder)

    @GetMapping
    fun list() = repo.findAllByOrderByYearDesc().map { toResponse(it) }

    @GetMapping("/featured")
    fun featured(): List<ExternalMixResponse> {
        val featured = repo.findByHomeFeaturedTrueOrderByHomeDisplayOrderAsc()
        if (featured.isNotEmpty()) return featured.map { toResponse(it) }
        return repo.findByEmbedTypeOrderByYearDesc("youtube").take(2).map { toResponse(it) }
    }
}
