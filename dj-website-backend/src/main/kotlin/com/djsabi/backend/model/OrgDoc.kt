package com.djsabi.backend.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "org_docs", uniqueConstraints = [UniqueConstraint(columnNames = ["doc_type", "language"])])
class OrgDoc(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,
    val docType: String = "",
    val language: String = "",
    @Column(columnDefinition = "TEXT")
    val url: String = "",
    val createdAt: LocalDateTime = LocalDateTime.now()
)
