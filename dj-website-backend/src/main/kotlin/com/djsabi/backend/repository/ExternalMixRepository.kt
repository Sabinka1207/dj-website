package com.djsabi.backend.repository

import com.djsabi.backend.model.ExternalMix
import org.springframework.data.jpa.repository.JpaRepository

interface ExternalMixRepository : JpaRepository<ExternalMix, Long> {
    fun findAllByOrderByYearDesc(): List<ExternalMix>
    fun findByHomeFeaturedTrueOrderByYearDesc(): List<ExternalMix>
}
