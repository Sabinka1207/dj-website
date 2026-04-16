package com.djsabi.backend

import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import jakarta.servlet.http.HttpServletRequest

@RestControllerAdvice
class GlobalExceptionHandler(private val telegram: TelegramService) {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<Map<String, String>> {
        val errors = ex.bindingResult.fieldErrors
            .associate { it.field to (it.defaultMessage ?: "Invalid value") }
        return ResponseEntity.badRequest().body(errors)
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpected(ex: Exception, request: HttpServletRequest): ResponseEntity<Map<String, String>> {
        log.error("Unhandled exception on ${request.method} ${request.requestURI}", ex)
        val detail = buildString {
            append("`${request.method} ${request.requestURI}`\n\n")
            append(ex.message?.take(300) ?: "No message")
            append("\n\n```\n")
            append(ex.stackTraceToString().take(1200))
            append("\n```")
        }
        runCatching { telegram.sendErrorAlert("Backend exception: ${ex.javaClass.simpleName}", detail) }
        return ResponseEntity.internalServerError().body(mapOf("error" to "Internal server error"))
    }
}
