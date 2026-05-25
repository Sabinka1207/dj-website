package com.djsabi.backend

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.multipart
import org.springframework.test.web.servlet.patch

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = ["spring.flyway.baseline-on-migrate=false"])
class AdminEventPosterTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var emailService: EmailService

    @MockBean
    lateinit var telegramService: TelegramService

    @Test
    fun `poster upload returns 401 without auth token`() {
        val file = MockMultipartFile("poster", "poster.jpg", "image/jpeg", ByteArray(10))
        mockMvc.multipart("/api/admin/events/1/poster") {
            file(file)
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `poster delete returns 401 without auth token`() {
        mockMvc.delete("/api/admin/events/1/poster").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `poster focus update returns 401 without auth token`() {
        mockMvc.patch("/api/admin/events/1/poster-focus") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"focusX":50,"focusY":50}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }
}
