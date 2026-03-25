package com.djsabi.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "events")
data class Event(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var date: String = "",
    var venue: String = "",
    var city: String = "",
    var country: String = "",
    var description: String = ""
)
