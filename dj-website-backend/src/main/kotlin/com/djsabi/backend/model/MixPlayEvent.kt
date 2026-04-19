package com.djsabi.backend.model

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "mix_play_events")
data class MixPlayEvent(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val mixId: Long = 0,
    val visitorId: String = "",
    val secondsPlayed: Int = 0,
    @Column(columnDefinition = "timestamptz")
    val playedAt: Instant = Instant.now()
)
