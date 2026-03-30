package com.djsabi.backend.repository

import com.djsabi.backend.model.BookingRequest
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.transaction.annotation.Transactional

interface BookingRequestRepository : JpaRepository<BookingRequest, Long> {
    fun countByStatus(status: String): Long

    @Modifying
    @Transactional
    @Query("UPDATE BookingRequest b SET b.status = :status WHERE b.id = :id")
    fun updateStatus(@Param("id") id: Long, @Param("status") status: String)

    @Modifying
    @Transactional
    @Query("UPDATE BookingRequest b SET b.status = 'answered', b.reply = :reply WHERE b.id = :id")
    fun updateReply(@Param("id") id: Long, @Param("reply") reply: String)
}
