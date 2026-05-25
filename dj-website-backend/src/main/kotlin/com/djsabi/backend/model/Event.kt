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
    var description: String = "",
    var posterUrl: String = "",
    var posterPublicId: String = "",
    @Column(name = "poster_focus_x")
    var posterFocusX: Int = 50,
    @Column(name = "poster_focus_y")
    var posterFocusY: Int = 50
)
