package com.djsabi.backend

import com.djsabi.backend.model.Event
import com.djsabi.backend.repository.EventRepository
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class DataInitializer(private val eventRepository: EventRepository) : ApplicationRunner {

    private val mapper = jacksonObjectMapper()

    override fun run(args: ApplicationArguments) {
        if (eventRepository.count() > 0) return

        val resource = ClassPathResource("events.json")
        if (!resource.exists()) return

        val raw: List<Map<String, String>> = mapper.readValue(resource.inputStream)
        val events = raw.map { m ->
            Event(
                date = m["date"] ?: "",
                venue = m["venue"] ?: "",
                city = m["city"] ?: "",
                country = m["country"] ?: "",
                description = m["description"] ?: ""
            )
        }
        eventRepository.saveAll(events)
    }
}
