package com.djsabi.backend.repository

import com.djsabi.backend.model.Event
import org.springframework.data.jpa.repository.JpaRepository

interface EventRepository : JpaRepository<Event, Long>
