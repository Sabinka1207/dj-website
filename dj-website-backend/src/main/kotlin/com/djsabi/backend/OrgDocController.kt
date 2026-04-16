package com.djsabi.backend

import com.djsabi.backend.repository.OrgDocRepository
import org.springframework.web.bind.annotation.*

data class OrgDocResponse(val id: Long, val docType: String, val language: String, val url: String, val createdAt: String)

@RestController
@RequestMapping("/api/org-docs")
class OrgDocController(private val orgDocRepository: OrgDocRepository) {

    @GetMapping
    fun list(): List<OrgDocResponse> =
        orgDocRepository.findAll().map { OrgDocResponse(it.id, it.docType, it.language, it.url, it.createdAt.toString()) }
}
