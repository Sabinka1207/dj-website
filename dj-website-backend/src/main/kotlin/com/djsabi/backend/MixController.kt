package com.djsabi.backend

import com.djsabi.backend.repository.MixRepository
import org.springframework.web.bind.annotation.*

data class MixResponse(
    val id: Long,
    val url: String,
    val coverUrl: String,
    val title: String,
    val year: Int,
    val style: String,
    val event: String,
    val city: String,
    val durationSeconds: Int,
    val displayOrder: Int
)

@RestController
@RequestMapping("/api/mixes")
class MixController(private val mixRepository: MixRepository) {

    private fun toResponse(m: com.djsabi.backend.model.Mix) =
        MixResponse(m.id, m.url, m.coverUrl, m.title, m.year, m.style, m.event, m.city, m.durationSeconds, m.displayOrder)

    @GetMapping
    fun list() = mixRepository.findAll().sortedBy { it.displayOrder }.map { toResponse(it) }

    @GetMapping("/featured")
    fun featured() = mixRepository.findByHomeFeaturedTrueOrderByHomeDisplayOrderAsc().map { toResponse(it) }
}
