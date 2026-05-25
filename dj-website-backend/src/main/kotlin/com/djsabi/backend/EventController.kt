package com.djsabi.backend

import com.djsabi.backend.repository.EventRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class EventController(private val eventRepository: EventRepository) {

    @GetMapping("/events")
    fun events(): List<EventResponse> =
        eventRepository.findAll()
            .sortedBy { it.date }
            .map { EventResponse(it.id.toString(), it.date, it.venue, it.city, it.country, it.description, it.posterUrl, it.posterFocusX, it.posterFocusY) }
}
