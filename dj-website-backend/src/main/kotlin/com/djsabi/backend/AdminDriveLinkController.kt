package com.djsabi.backend

import com.djsabi.backend.model.DriveLink
import com.djsabi.backend.repository.DriveLinkRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class DriveLinkResponse(val id: Long, val linkKey: String, val url: String)
data class DriveLinkRequest(val url: String)

@RestController
@RequestMapping("/api/admin/drive-links")
class AdminDriveLinkController(
    private val repo: DriveLinkRepository,
    private val authService: AdminAuthService
) {
    private fun authorized(req: HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    private fun toResponse(dl: DriveLink) = DriveLinkResponse(dl.id, dl.linkKey, dl.url)

    @GetMapping
    fun list(req: HttpServletRequest): ResponseEntity<List<DriveLinkResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        return ResponseEntity.ok(repo.findAll().map { toResponse(it) })
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody body: DriveLinkRequest, req: HttpServletRequest): ResponseEntity<DriveLinkResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val existing = repo.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        val saved = repo.save(DriveLink(id = id, linkKey = existing.linkKey, url = body.url.trim()))
        return ResponseEntity.ok(toResponse(saved))
    }
}
