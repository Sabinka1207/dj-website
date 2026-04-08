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
    val city: String
)

@RestController
@RequestMapping("/api/external-mixes")
class ExternalMixController(private val repo: ExternalMixRepository) {

    @GetMapping
    fun list() = repo.findAllByOrderByYearDesc().map {
        ExternalMixResponse(it.id, it.embedUrl, it.embedType, it.title, it.year, it.style, it.event, it.city)
    }
}
