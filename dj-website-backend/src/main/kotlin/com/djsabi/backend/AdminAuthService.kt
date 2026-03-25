package com.djsabi.backend

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class AdminAuthService {

    @Value("\${app.admin.password}")
    private lateinit var adminPassword: String

    @Value("\${app.admin.google.email}")
    private lateinit var adminGoogleEmail: String

    private val tokens = mutableMapOf<String, Instant>()
    private val tokenTtl = java.time.Duration.ofHours(1)

    fun login(password: String): String? {
        if (password != adminPassword) return null
        return issueToken()
    }

    fun googleLogin(accessToken: String): String? {
        try {
            val response = java.net.http.HttpClient.newHttpClient().send(
                java.net.http.HttpRequest.newBuilder(java.net.URI.create("https://www.googleapis.com/oauth2/v3/userinfo"))
                    .header("Authorization", "Bearer $accessToken")
                    .GET().build(),
                java.net.http.HttpResponse.BodyHandlers.ofString()
            )
            if (response.statusCode() != 200) return null
            val email = Regex(""""email"\s*:\s*"([^"]+)"""").find(response.body())?.groupValues?.get(1)
            if (email.isNullOrEmpty() || email != adminGoogleEmail) return null
            return issueToken()
        } catch (_: Exception) {
            return null
        }
    }

    fun isValid(token: String): Boolean {
        val created = tokens[token] ?: return false
        if (Instant.now().isAfter(created.plus(tokenTtl))) {
            tokens.remove(token)
            return false
        }
        return true
    }

    private fun issueToken(): String {
        val token = UUID.randomUUID().toString()
        tokens[token] = Instant.now()
        return token
    }
}
