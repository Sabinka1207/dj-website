package com.djsabi.backend

data class EventResponse(
    val id: String,
    val date: String,
    val venue: String,
    val city: String,
    val country: String,
    val description: String,
    val posterUrl: String = "",
    val posterFocusX: Int = 50,
    val posterFocusY: Int = 50,
)
