package com.djsabi.backend.repository

import com.djsabi.backend.model.OrgDoc
import org.springframework.data.jpa.repository.JpaRepository

interface OrgDocRepository : JpaRepository<OrgDoc, Long> {
    fun existsByDocTypeAndLanguage(docType: String, language: String): Boolean
}
