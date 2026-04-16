package com.djsabi.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "mixes")
data class Mix(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var publicId: String = "",
    var url: String = "",
    var title: String = "",
    @Column(name = "release_year")
    var year: Int = 0,
    var style: String = "",
    var event: String = "",
    var city: String = "",
    var coverUrl: String = "",
    var coverPublicId: String = "",
    var durationSeconds: Int = 0,
    var displayOrder: Int = 0,
    var homeFeatured: Boolean = false,
    var homeDisplayOrder: Int = 0
)
