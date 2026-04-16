package com.djsabi.backend

import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.doThrow
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = ["spring.flyway.baseline-on-migrate=false"])
class ContactControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var emailService: EmailService

    @MockBean
    lateinit var telegramService: TelegramService

    private val validBody = """{"name":"Test","email":"test@example.com","event":"Party","date":"2026-06-01","message":"Hello there world"}"""

    @Test
    fun `contact form returns 200 on success`() {
        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody
            header("X-Forwarded-For", "10.0.0.1")
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    fun `contact form returns 200 even when email service throws`() {
        doThrow(RuntimeException("SMTP error")).whenever(emailService).sendContactEmail(any())

        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody
            header("X-Forwarded-For", "10.0.0.2")
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    fun `contact form returns 200 even when telegram service throws`() {
        doThrow(RuntimeException("Telegram error")).whenever(telegramService).sendNotification(any())

        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody
            header("X-Forwarded-For", "10.0.0.3")
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    fun `contact form returns 400 when name is blank`() {
        val body = """{"name":"","email":"test@example.com","message":"Hello there world"}"""
        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = body
            header("X-Forwarded-For", "10.0.0.4")
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `contact form returns 400 when email is invalid`() {
        val body = """{"name":"Test","email":"not-an-email","message":"Hello there world"}"""
        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = body
            header("X-Forwarded-For", "10.0.0.5")
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `contact form returns 400 when message is blank`() {
        val body = """{"name":"Test","email":"test@example.com","message":""}"""
        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = body
            header("X-Forwarded-For", "10.0.0.6")
        }.andExpect {
            status { isBadRequest() }
        }
    }

    @Test
    fun `contact form returns 200 without optional event and date fields`() {
        val body = """{"name":"Organiser","email":"org@example.com","message":"Just a question here","source":"organisers"}"""
        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = body
            header("X-Forwarded-For", "10.0.0.7")
        }.andExpect {
            status { isOk() }
        }
    }

    @Test
    fun `contact form returns 429 after exceeding rate limit`() {
        val ip = "10.99.99.99"
        repeat(5) {
            mockMvc.post("/api/contact") {
                contentType = MediaType.APPLICATION_JSON
                content = validBody
                header("X-Forwarded-For", ip)
            }.andExpect {
                status { isOk() }
            }
        }
        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody
            header("X-Forwarded-For", ip)
        }.andExpect {
            status { isEqualTo(429) }
        }
    }
}
