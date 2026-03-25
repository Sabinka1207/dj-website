package com.djsabi.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "photos")
data class Photo(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) val id: Long = 0,
    var publicId: String = "",
    var url: String = "",
    var displayOrder: Int = 0
)
