package com.djsabi.backend

import com.djsabi.backend.model.OrgDoc
import com.djsabi.backend.repository.OrgDocRepository
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class OrgDocRequest(val docType: String, val language: String, val url: String)

@RestController
@RequestMapping("/api/admin/org-docs")
class AdminOrgDocController(
    private val orgDocRepository: OrgDocRepository,
    private val authService: AdminAuthService
) {
    private fun authorized(req: HttpServletRequest): Boolean {
        val header = req.getHeader("Authorization") ?: return false
        val token = header.removePrefix("Bearer ").trim()
        return authService.isValid(token)
    }

    private fun toResponse(doc: OrgDoc) =
        OrgDocResponse(doc.id, doc.docType, doc.language, doc.url, doc.createdAt.toString())

    @GetMapping
    fun list(req: HttpServletRequest): ResponseEntity<List<OrgDocResponse>> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val docs = orgDocRepository.findAll()
            .sortedWith(compareBy({ it.docType }, { it.language }))
            .map { toResponse(it) }
        return ResponseEntity.ok(docs)
    }

    @PostMapping
    fun create(@RequestBody body: OrgDocRequest, req: HttpServletRequest): ResponseEntity<OrgDocResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (orgDocRepository.existsByDocTypeAndLanguage(body.docType, body.language))
            return ResponseEntity.status(409).build()
        val saved = orgDocRepository.save(OrgDoc(docType = body.docType, language = body.language, url = body.url))
        return ResponseEntity.ok(toResponse(saved))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody body: OrgDocRequest, req: HttpServletRequest): ResponseEntity<OrgDocResponse> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        val existing = orgDocRepository.findById(id).orElse(null) ?: return ResponseEntity.notFound().build()
        // check uniqueness only if type/lang changed
        if ((body.docType != existing.docType || body.language != existing.language) &&
            orgDocRepository.existsByDocTypeAndLanguage(body.docType, body.language))
            return ResponseEntity.status(409).build()
        val saved = orgDocRepository.save(OrgDoc(id = id, docType = body.docType, language = body.language, url = body.url, createdAt = existing.createdAt))
        return ResponseEntity.ok(toResponse(saved))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, req: HttpServletRequest): ResponseEntity<Void> {
        if (!authorized(req)) return ResponseEntity.status(401).build()
        if (!orgDocRepository.existsById(id)) return ResponseEntity.notFound().build()
        orgDocRepository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
