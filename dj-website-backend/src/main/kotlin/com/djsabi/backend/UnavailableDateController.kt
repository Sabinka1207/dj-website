package com.djsabi.backend

import com.djsabi.backend.repository.UnavailableDateRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

data class UnavailableDatePublic(val date: String, val note: String?)

@RestController
@RequestMapping("/api/unavailable-dates")
class UnavailableDateController(
    private val unavailableDateRepository: UnavailableDateRepository
) {
    @GetMapping
    fun list(): List<UnavailableDatePublic> =
        unavailableDateRepository.findAll().flatMap { entry ->
            val end = entry.endDate
            if (end == null || end == entry.date) {
                listOf(UnavailableDatePublic(entry.date, entry.note))
            } else {
                val start = LocalDate.parse(entry.date)
                val finish = LocalDate.parse(end)
                generateSequence(start) { it.plusDays(1) }
                    .takeWhile { !it.isAfter(finish) }
                    .map { UnavailableDatePublic(it.toString(), entry.note) }
                    .toList()
            }
        }
}
