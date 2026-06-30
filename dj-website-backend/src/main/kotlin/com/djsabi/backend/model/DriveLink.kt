package com.djsabi.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "drive_links")
class DriveLink(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    @Column(name = "link_key", unique = true)
    val linkKey: String = "",
    @Column(columnDefinition = "TEXT")
    val url: String = ""
)
