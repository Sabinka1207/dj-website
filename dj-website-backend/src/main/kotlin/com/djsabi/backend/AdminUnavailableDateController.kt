package com.djsabi.backend

import com.djsabi.backend.model.UnavailableDate
import com.djsabi.backend.repository.UnavailableDateRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class UnavailableDateRequest(val date: String, val endDate: String? = null, val note: String? = null)
data class UnavailableDateResponse(val id: Long, val date: String, val endDate: String?, val note: String?)

@RestController
@RequestMapping("/api/admin/unavailable-dates")
class AdminUnavailableDateController(
    private val unavailableDateRepository: UnavailableDateRepository,
    private val authService: AdminAuthService
) {
    private fun authorized(req: jakarta.servlet.http.HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    @GetMapping
    fun list(req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<List<UnavailableDateResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val dates = unavailableDateRepository.findAll()
            .sortedBy { it.date }
            .map { UnavailableDateResponse(it.id, it.date, it.endDate, it.note) }
        return ResponseEntity.ok(dates)
    }

    @PostMapping
    fun add(
        @RequestBody body: UnavailableDateRequest,
        req: jakarta.servlet.http.HttpServletRequest
    ): ResponseEntity<UnavailableDateResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val saved = unavailableDateRepository.save(UnavailableDate(date = body.date, endDate = body.endDate?.ifBlank { null }, note = body.note))
        return ResponseEntity.ok(UnavailableDateResponse(saved.id, saved.date, saved.endDate, saved.note))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, req: jakarta.servlet.http.HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (!unavailableDateRepository.existsById(id)) return ResponseEntity.notFound().build()
        unavailableDateRepository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
