package com.djsabi.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "external_mixes")
data class ExternalMix(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    var embedUrl: String = "",
    var embedType: String = "",
    var title: String = "",
    @Column(name = "release_year")
    var year: Int = 0,
    var style: String = "",
    var event: String = "",
    var city: String = ""
)
