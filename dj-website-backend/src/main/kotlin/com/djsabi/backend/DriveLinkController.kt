package com.djsabi.backend

import com.djsabi.backend.repository.DriveLinkRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/drive-links")
class DriveLinkController(private val repo: DriveLinkRepository) {

    @GetMapping
    fun list(): ResponseEntity<Map<String, String>> {
        val map = repo.findAll().associate { it.linkKey to it.url }
        return ResponseEntity.ok(map)
    }
}
