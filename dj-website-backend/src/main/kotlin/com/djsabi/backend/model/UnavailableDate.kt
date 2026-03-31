package com.djsabi.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "unavailable_dates")
class UnavailableDate(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val date: String = "",
    val endDate: String? = null,
    val note: String? = null
)
