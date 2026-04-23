package com.djsabi.backend

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.multipart

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = ["spring.flyway.baseline-on-migrate=false"])
class AdminMixUploadValidationTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var emailService: EmailService

    @MockBean
    lateinit var telegramService: TelegramService

    @Test
    fun `upload returns 401 without auth token`() {
        val file = MockMultipartFile("file", "mix.mp3", "audio/mpeg", ByteArray(10))
        mockMvc.multipart("/api/admin/mixes/upload") {
            file(file)
            param("title", "Test Mix")
            param("year", "2024")
            param("style", "")
            param("event", "")
            param("city", "")
            param("durationSeconds", "0")
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `upload rejects non-audio file when not authenticated`() {
        val file = MockMultipartFile("file", "virus.exe", "application/octet-stream", ByteArray(10))
        mockMvc.multipart("/api/admin/mixes/upload") {
            file(file)
            param("title", "Bad File")
            param("year", "2024")
            param("style", "")
            param("event", "")
            param("city", "")
            param("durationSeconds", "0")
        }.andExpect {
            // 401 before file type check is fine — auth happens first
            status { isUnauthorized() }
        }
    }
}
