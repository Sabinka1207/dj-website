package com.djsabi.backend

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import java.net.URI

@Configuration
class R2Config {

    @Value("\${r2.account-id}")
    private lateinit var accountId: String

    @Value("\${r2.access-key-id}")
    private lateinit var accessKeyId: String

    @Value("\${r2.secret-access-key}")
    private lateinit var secretAccessKey: String

    @Bean
    fun s3Client(): S3Client = S3Client.builder()
        .endpointOverride(URI.create("https://$accountId.r2.cloudflarestorage.com"))
        .credentialsProvider(StaticCredentialsProvider.create(
            AwsBasicCredentials.create(accessKeyId, secretAccessKey)
        ))
        .region(Region.of("auto"))
        .build()
}
