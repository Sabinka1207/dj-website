package com.djsabi.backend

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.test.util.ReflectionTestUtils
import java.time.Instant

class AdminAuthServiceTest {

    private lateinit var authService: AdminAuthService

    @BeforeEach
    fun setUp() {
        authService = AdminAuthService()
        ReflectionTestUtils.setField(authService, "adminPassword", "testpass")
        ReflectionTestUtils.setField(authService, "adminGoogleEmail", "admin@example.com")
    }

    @Test
    fun `login with correct password returns a valid token`() {
        val token = authService.login("testpass")
        assertNotNull(token)
        assertTrue(authService.isValid(token!!))
    }

    @Test
    fun `login with wrong password returns null`() {
        val token = authService.login("wrongpass")
        assertNull(token)
    }

    @Test
    fun `isValid returns false for unknown token`() {
        assertFalse(authService.isValid("non-existent-token"))
    }

    @Test
    fun `isValid returns false for expired token`() {
        val token = authService.login("testpass")!!
        // Force the token creation time to be 2 hours in the past
        @Suppress("UNCHECKED_CAST")
        val tokens = ReflectionTestUtils.getField(authService, "tokens") as MutableMap<String, Instant>
        tokens[token] = Instant.now().minusSeconds(7200)

        assertFalse(authService.isValid(token))
    }
}
