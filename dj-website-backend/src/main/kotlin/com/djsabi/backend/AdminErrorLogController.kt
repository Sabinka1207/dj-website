package com.djsabi.backend

import com.djsabi.backend.model.ErrorLogEntry
import com.djsabi.backend.repository.ErrorLogEntryRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/error-log")
class AdminErrorLogController(private val repo: ErrorLogEntryRepository) {

    @GetMapping
    fun list(): List<ErrorLogEntry> = repo.findTop200ByOrderByOccurredAtDesc()
}
