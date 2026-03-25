package com.djsabi.backend

import com.djsabi.backend.repository.PhotoRepository
import org.springframework.web.bind.annotation.*

data class PhotoResponse(val id: Long, val url: String)

@RestController
@RequestMapping("/api/photos")
class PhotoController(private val photoRepository: PhotoRepository) {

    @GetMapping
    fun list() = photoRepository.findAll()
        .sortedBy { it.displayOrder }
        .map { PhotoResponse(it.id, it.url) }
}
