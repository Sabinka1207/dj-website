package com.djsabi.backend.repository

import com.djsabi.backend.model.UnavailableDate
import org.springframework.data.jpa.repository.JpaRepository

interface UnavailableDateRepository : JpaRepository<UnavailableDate, Long>
