package com.djsabi.backend

import com.djsabi.backend.repository.MixRepository
import org.springframework.web.bind.annotation.*

data class MixResponse(
    val id: Long,
    val url: String,
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

    @GetMapping
    fun list() = mixRepository.findAll()
        .sortedBy { it.displayOrder }
        .map {
            MixResponse(it.id, it.url, it.title, it.year, it.style, it.event, it.city, it.durationSeconds, it.displayOrder)
        }
}
