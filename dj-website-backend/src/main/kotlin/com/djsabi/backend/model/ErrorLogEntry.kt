package com.djsabi.backend.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "error_log")
data class ErrorLogEntry(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val occurredAt: Instant = Instant.now(),
    val errorType: String = "",
    val message: String? = null,
    val method: String? = null,
    val uri: String? = null,
    val ip: String? = null,
    val userAgent: String? = null,
    @Column(columnDefinition = "TEXT")
    val stackTrace: String? = null
)
