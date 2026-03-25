package com.djsabi.backend

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class LoginRequest(val password: String)
data class GoogleLoginRequest(val accessToken: String)
data class LoginResponse(val token: String)

@RestController
@RequestMapping("/api/admin")
class AdminAuthController(private val authService: AdminAuthService) {

    @PostMapping("/login")
    fun login(@RequestBody req: LoginRequest): ResponseEntity<LoginResponse> {
        val token = authService.login(req.password)
            ?: return ResponseEntity.status(401).build()
        return ResponseEntity.ok(LoginResponse(token))
    }

    @PostMapping("/google-login")
    fun googleLogin(@RequestBody req: GoogleLoginRequest): ResponseEntity<LoginResponse> {
        val token = authService.googleLogin(req.accessToken)
            ?: return ResponseEntity.status(401).build()
        return ResponseEntity.ok(LoginResponse(token))
    }
}
