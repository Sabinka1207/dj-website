package com.djsabi.backend

import com.djsabi.backend.model.MixDownloadEvent
import com.djsabi.backend.model.MixPlayEvent
import com.djsabi.backend.repository.MixDownloadEventRepository
import com.djsabi.backend.repository.MixPlayEventRepository
import com.djsabi.backend.repository.MixRepository
import com.mpatric.mp3agic.ID3v24Tag
import jakarta.servlet.http.HttpServletResponse
import java.io.IOException
import java.net.URI
import java.util.concurrent.CompletableFuture
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.context.request.async.AsyncRequestNotUsableException
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.HeadObjectRequest

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

private val CLIENT_DISCONNECT_MESSAGES = setOf("broken pipe", "connection reset by peer")

private fun isClientDisconnect(e: Throwable): Boolean =
    e is AsyncRequestNotUsableException ||
        (e is IOException && CLIENT_DISCONNECT_MESSAGES.any { e.message?.lowercase()?.contains(it) == true }) ||
        (e.cause != null && isClientDisconnect(e.cause!!))

@RestController
@RequestMapping("/api/mixes")
class MixController(
    private val mixRepository: MixRepository,
    private val playEventRepository: MixPlayEventRepository,
    private val downloadEventRepository: MixDownloadEventRepository,
    private val s3Client: S3Client,
    @Value("\${r2.bucket-name:}") private val r2BucketName: String,
) {
    private val log = LoggerFactory.getLogger(MixController::class.java)

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

    private fun defaultCover(): Pair<ByteArray, String> {
        val bytes = javaClass.classLoader.getResourceAsStream("default-cover.png")
            ?.readBytes() ?: throw IllegalStateException("default-cover.png missing from resources")
        return bytes to "image/png"
    }

    private fun fetchCover(coverUrl: String, mixId: Long): Pair<ByteArray, String> {
        if (coverUrl.isBlank()) return defaultCover()
        return try {
            val bytes = URI(coverUrl).toURL().readBytes()
            val mime = if (coverUrl.contains(".png", ignoreCase = true)) "image/png" else "image/jpeg"
            bytes to mime
        } catch (e: Exception) {
            log.warn("Could not fetch cover image for mix {}: {}", mixId, e.message)
            defaultCover()
        }
    }

    private fun buildTagBytes(mix: com.djsabi.backend.model.Mix, namePart: String, coverBytes: ByteArray, coverMime: String): ByteArray {
        val tag = ID3v24Tag()
        tag.title = mix.title.ifBlank { namePart }
        tag.artist = "DJ SABI"
        tag.albumArtist = "DJ SABI"
        if (mix.year > 0) tag.year = mix.year.toString()
        if (mix.style.isNotBlank()) tag.genreDescription = mix.style.split(",").joinToString(", ") { it.trim() }
        tag.setAlbumImage(coverBytes, coverMime)
        return tag.toBytes()
    }

    @GetMapping("/{id}/download")
    fun download(@PathVariable id: Long, @RequestParam(defaultValue = "") v: String, response: HttpServletResponse) {
        val mix = mixRepository.findById(id).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
        if (mix.publicId.isBlank() || r2BucketName.isBlank()) throw ResponseStatusException(HttpStatus.NOT_FOUND)

        if (v.isNotBlank()) {
            downloadEventRepository.save(MixDownloadEvent(mixId = id, visitorId = v))
        }

        val namePart = ("DJ SABI - " + mix.title.ifBlank { "mix" })
            .replace(Regex("[/\\\\:*?\"<>|]"), "_")

        // fetch cover and S3 object size in parallel
        val coverFuture = CompletableFuture.supplyAsync { fetchCover(mix.coverUrl, id) }
        val s3SizeFuture = CompletableFuture.supplyAsync {
            s3Client.headObject(HeadObjectRequest.builder().bucket(r2BucketName).key(mix.publicId).build()).contentLength()
        }

        val (coverBytes, coverMime) = coverFuture.join()
        val s3Size = s3SizeFuture.join()

        val tagBytes = buildTagBytes(mix, namePart, coverBytes, coverMime)

        // detect and skip existing ID3 tag at the start of the S3 file
        val existingTagSize = s3Client.getObject(
            GetObjectRequest.builder().bucket(r2BucketName).key(mix.publicId).build()
        ).use { s3Stream ->
            val header = ByteArray(10)
            val read = s3Stream.read(header)
            if (read == 10 && header[0] == 'I'.code.toByte() && header[1] == 'D'.code.toByte() && header[2] == '3'.code.toByte()) {
                // syncsafe integer decode
                val b0 = header[6].toInt() and 0x7F
                val b1 = header[7].toInt() and 0x7F
                val b2 = header[8].toInt() and 0x7F
                val b3 = header[9].toInt() and 0x7F
                10 + (b0 shl 21 or (b1 shl 14) or (b2 shl 7) or b3)
            } else 0
        }

        val audioSize = s3Size - existingTagSize
        val totalSize = tagBytes.size + audioSize

        response.contentType = "audio/mpeg"
        response.setHeader("Content-Disposition", "attachment; filename=\"$namePart.mp3\"")
        response.setContentLengthLong(totalSize)

        val out = response.outputStream
        try {
            out.write(tagBytes)
            out.flush()

            s3Client.getObject(
                GetObjectRequest.builder()
                    .bucket(r2BucketName)
                    .key(mix.publicId)
                    .range("bytes=$existingTagSize-${s3Size - 1}")
                    .build()
            ).use { s3Stream -> s3Stream.transferTo(out) }
        } catch (e: Exception) {
            if (isClientDisconnect(e)) {
                log.debug("Client disconnected during download of mix {}", id)
            } else {
                log.error("Unexpected error streaming mix {} from S3", id, e)
                throw e
            }
        }
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
