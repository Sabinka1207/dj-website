package com.djsabi.backend.repository

import com.djsabi.backend.model.MixDownloadEvent
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface MixDownloadEventRepository : JpaRepository<MixDownloadEvent, Long> {
    fun countByMixId(mixId: Long): Long

    @Query("SELECT COUNT(DISTINCT e.visitorId) FROM MixDownloadEvent e WHERE e.mixId = :mixId")
    fun countDistinctVisitorsByMixId(mixId: Long): Long
}
