package com.djsabi.backend.repository

import com.djsabi.backend.model.Photo
import org.springframework.data.jpa.repository.JpaRepository

interface PhotoRepository : JpaRepository<Photo, Long>
