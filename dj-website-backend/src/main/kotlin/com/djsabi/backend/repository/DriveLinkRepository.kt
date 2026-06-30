package com.djsabi.backend.repository

import com.djsabi.backend.model.DriveLink
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional

interface DriveLinkRepository : JpaRepository<DriveLink, Long> {
    fun findByLinkKey(linkKey: String): Optional<DriveLink>
}
