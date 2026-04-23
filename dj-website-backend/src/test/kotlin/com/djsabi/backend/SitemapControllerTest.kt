package com.djsabi.backend

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = ["spring.flyway.baseline-on-migrate=false"])
class SitemapControllerTest {

    @Autowired
    lateinit var mockMvc: MockMvc

    @MockBean
    lateinit var emailService: EmailService

    @MockBean
    lateinit var telegramService: TelegramService

    @Test
    fun `sitemap returns 200 with xml content type`() {
        mockMvc.get("/api/sitemap.xml").andExpect {
            status { isOk() }
            content { contentTypeCompatibleWith("application/xml") }
        }
    }

    @Test
    fun `sitemap contains required static urls`() {
        val result = mockMvc.get("/api/sitemap.xml").andReturn()
        val body = result.response.contentAsString
        assert(body.contains("<urlset")) { "Missing urlset element" }
        assert(body.contains("/mixes")) { "Missing /mixes URL" }
        assert(body.contains("/impressum")) { "Missing /impressum URL" }
        assert(body.contains("/privacy")) { "Missing /privacy URL" }
    }
}
