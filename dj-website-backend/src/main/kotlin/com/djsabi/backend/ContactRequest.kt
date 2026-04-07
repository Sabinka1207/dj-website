package com.djsabi.backend

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class ContactRequest(
    @field:NotBlank(message = "Name is required")
    @field:Size(max = 200, message = "Name too long")
    val name: String,

    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Invalid email address")
    @field:Size(max = 200, message = "Email too long")
    val email: String,

    val event: String = "",
    val date: String = "",

    @field:NotBlank(message = "Message is required")
    @field:Size(max = 5000, message = "Message too long")
    val message: String,

    val source: String = "",
    val language: String = "",
)
