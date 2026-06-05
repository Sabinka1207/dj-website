package com.djsabi.backend

import com.djsabi.backend.model.ErrorLogEntry
import com.djsabi.backend.repository.ErrorLogEntryRepository
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.ErrorResponse
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import jakarta.servlet.http.HttpServletRequest

@RestControllerAdvice
class GlobalExceptionHandler(
    private val telegram: TelegramService,
    private val errorLogEntryRepository: ErrorLogEntryRepository,
) {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, String>> {
        val errors = ex.bindingResult.fieldErrors
            .associate { it.field to (it.defaultMessage ?: "Invalid value") }
        return ResponseEntity.badRequest().body(errors)
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(ex: Exception, request: HttpServletRequest): ResponseEntity<Map<String, String>> {
        // Spring's standard 4xx exceptions (NoResourceFoundException, MethodNotAllowedException, etc.)
        // all implement ErrorResponse — let Spring handle them without alerting
        if (ex is ErrorResponse) {
            return ResponseEntity.status(ex.statusCode).body(mapOf("error" to (ex.body.detail ?: ex.statusCode.toString())))
        }
        log.error("Unhandled exception on ${request.method} ${request.requestURI}", ex)
        val detail = buildString {
            append("`${request.method} ${request.requestURI}`\n\n")
            append(ex.message?.take(300) ?: "No message")
            append("\n\n```\n")
            append(ex.stackTraceToString().take(1200))
            append("\n```")
        }
        runCatching { telegram.sendErrorAlert("Backend exception: ${ex.javaClass.simpleName}", detail) }
        runCatching {
            errorLogEntryRepository.save(
                ErrorLogEntry(
                    errorType  = ex.javaClass.simpleName,
                    message    = ex.message?.take(500),
                    method     = request.method,
                    uri        = request.requestURI,
                    ip         = resolveClientIp(request),
                    userAgent  = request.getHeader("User-Agent")?.take(300),
                    stackTrace = ex.stackTraceToString().take(3000),
                )
            )
        }
        return ResponseEntity.internalServerError().body(mapOf("error" to "Internal server error"))
    }

    private fun resolveClientIp(request: HttpServletRequest): String {
        val forwarded = request.getHeader("X-Forwarded-For")
        return (forwarded?.split(",")?.firstOrNull()?.trim() ?: request.remoteAddr).take(64)
    }
}
