package com.djsabi.backend.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "booking_requests")
class BookingRequest(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val name: String = "",
    val email: String = "",
    val event: String = "",
    val date: String = "",
    @Column(columnDefinition = "TEXT")
    val message: String = "",
    val source: String = "",
    val language: String = "",
    var status: String = "new",  // "new" | "read" | "answered"
    @Column(columnDefinition = "TEXT")
    var reply: String? = null,
    val submittedAt: LocalDateTime = LocalDateTime.now()
)
