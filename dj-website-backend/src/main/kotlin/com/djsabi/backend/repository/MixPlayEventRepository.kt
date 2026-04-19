package com.djsabi.backend.repository

import com.djsabi.backend.model.MixPlayEvent
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface MixPlayEventRepository : JpaRepository<MixPlayEvent, Long> {
    fun countByMixId(mixId: Long): Long
    fun countByMixIdAndVisitorId(mixId: Long, visitorId: String): Long

    @Query("SELECT COALESCE(SUM(e.secondsPlayed), 0) FROM MixPlayEvent e WHERE e.mixId = :mixId")
    fun sumSecondsPlayedByMixId(mixId: Long): Long

    @Query("SELECT COUNT(DISTINCT e.visitorId) FROM MixPlayEvent e WHERE e.mixId = :mixId")
    fun countDistinctVisitorsByMixId(mixId: Long): Long
}
