package com.djsabi.backend.repository

import com.djsabi.backend.model.Mix
import org.springframework.data.jpa.repository.JpaRepository

interface MixRepository : JpaRepository<Mix, Long>
