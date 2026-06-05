package com.djsabi.backend.repository

import com.djsabi.backend.model.ErrorLogEntry
import org.springframework.data.jpa.repository.JpaRepository

interface ErrorLogEntryRepository : JpaRepository<ErrorLogEntry, Long> {
    fun findTop200ByOrderByOccurredAtDesc(): List<ErrorLogEntry>
}
