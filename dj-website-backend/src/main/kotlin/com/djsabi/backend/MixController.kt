package com.djsabi.backend

import com.djsabi.backend.model.MixDownloadEvent
import com.djsabi.backend.model.MixPlayEvent
import com.djsabi.backend.repository.MixDownloadEventRepository
import com.djsabi.backend.repository.MixPlayEventRepository
import com.djsabi.backend.repository.MixRepository
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.GetObjectRequest

data class MixResponse(
    val id: Long,
    val url: String,
    val coverUrl: String,
    val title: String,
    val year: Int,
    val style: String,
    val event: String,
    val city: String,
    val durationSeconds: Int,
    val displayOrder: Int
)

data class PlayRequest(val visitorId: String = "", val secondsPlayed: Int = 0)

data class MixStatResponse(
    val mixId: Long,
    val title: String,
    val year: Int,
    val plays: Long,
    val uniqueListeners: Long,
    val totalSecondsPlayed: Long,
    val downloads: Long,
    val uniqueDownloaders: Long
)

@RestController
@RequestMapping("/api/mixes")
class MixController(
    private val mixRepository: MixRepository,
    private val playEventRepository: MixPlayEventRepository,
    private val downloadEventRepository: MixDownloadEventRepository,
    private val s3Client: S3Client,
    @Value("\${r2.bucket-name:}") private val r2BucketName: String,
) {

    private fun toResponse(m: com.djsabi.backend.model.Mix) =
        MixResponse(m.id, m.url, m.coverUrl, m.title, m.year, m.style, m.event, m.city, m.durationSeconds, m.displayOrder)

    @GetMapping
    fun list() = mixRepository.findAll().sortedBy { it.displayOrder }.map { toResponse(it) }

    @GetMapping("/featured")
    fun featured() = mixRepository.findByHomeFeaturedTrueOrderByHomeDisplayOrderAsc().map { toResponse(it) }

    @PostMapping("/{id}/played")
    fun recordPlay(@PathVariable id: Long, @RequestBody body: PlayRequest): ResponseEntity<Void> {
        if (body.secondsPlayed < 5 || body.visitorId.isBlank()) return ResponseEntity.ok().build()
        mixRepository.findById(id).ifPresent {
            playEventRepository.save(MixPlayEvent(mixId = id, visitorId = body.visitorId, secondsPlayed = body.secondsPlayed))
        }
        return ResponseEntity.ok().build()
    }

    @GetMapping("/{id}/download")
    fun download(@PathVariable id: Long, @RequestParam(defaultValue = "") v: String, response: HttpServletResponse) {
        val mix = mixRepository.findById(id).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
        if (mix.publicId.isBlank() || r2BucketName.isBlank()) throw ResponseStatusException(HttpStatus.NOT_FOUND)

        if (v.isNotBlank()) {
            downloadEventRepository.save(MixDownloadEvent(mixId = id, visitorId = v))
        }

        val namePart = buildString {
            append("DJ SABI - ")
            append(mix.title.ifBlank { "mix" })
            if (mix.year > 0) append(", ${mix.year}")
        }.replace(Regex("[/\\\\:*?\"<>|]"), "_")

        val s3Response = s3Client.getObject(
            GetObjectRequest.builder().bucket(r2BucketName).key(mix.publicId).build()
        )

        response.contentType = "audio/mpeg"
        response.setHeader("Content-Disposition", "attachment; filename=\"$namePart.mp3\"")
        s3Response.transferTo(response.outputStream)
    }
}

@RestController
@RequestMapping("/api/admin/mix-stats")
class AdminMixStatsController(
    private val mixRepository: MixRepository,
    private val playEventRepository: MixPlayEventRepository,
    private val downloadEventRepository: MixDownloadEventRepository,
) {
    @GetMapping
    fun stats(): List<MixStatResponse> {
        return mixRepository.findAll().map { mix ->
            MixStatResponse(
                mixId = mix.id,
                title = mix.title,
                year = mix.year,
                plays = playEventRepository.countByMixId(mix.id),
                uniqueListeners = playEventRepository.countDistinctVisitorsByMixId(mix.id),
                totalSecondsPlayed = playEventRepository.sumSecondsPlayedByMixId(mix.id),
                downloads = downloadEventRepository.countByMixId(mix.id),
                uniqueDownloaders = downloadEventRepository.countDistinctVisitorsByMixId(mix.id)
            )
        }.sortedByDescending { it.plays }
    }
}
