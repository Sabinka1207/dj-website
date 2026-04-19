package com.djsabi.backend.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "mix_download_events")
data class MixDownloadEvent(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val mixId: Long = 0,
    val visitorId: String = "",
    val downloadedAt: Instant = Instant.now()
)
