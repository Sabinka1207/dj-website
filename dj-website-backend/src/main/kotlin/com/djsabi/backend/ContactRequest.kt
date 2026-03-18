package com.djsabi.backend

data class ContactRequest(
    val name: String,
    val email: String,
    val event: String,
    val date: String,
    val message: String,
)
