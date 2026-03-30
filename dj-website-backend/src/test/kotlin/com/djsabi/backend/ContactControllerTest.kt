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
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
class ContactControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var emailService: EmailService

    @MockBean
    lateinit var telegramService: TelegramService

    private val validBody = """{"name":"Test","email":"test@example.com","event":"Party","date":"2026-06-01","message":"Hello"}"""

    @Test
    fun `contact form returns 200 on success`() {
        mockMvc.post("/api/contact") {
            contentType = MediaType.APPLICATION_JSON
            content = validBody
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
        }.andExpect {
            status { isOk() }
        }
    }
}
