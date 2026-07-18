package com.luanvp.metamodel.keyboard.network

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * OkHttp-based client for any OpenAI-compatible chat completion endpoint.
 *
 * Compatible with Ollama (/v1/chat/completions), LM Studio, LiteLLM, vLLM.
 * Mirrors keyboard/client/http-client.ts.
 */
class OpenAiHttpClient(
    private val baseUrl: String,
    private val okHttpClient: OkHttpClient,
    private val apiKey: String? = null,
) {

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    /**
     * Perform a synchronous (non-streaming) chat completion request.
     */
    suspend fun chatCompletion(request: ChatCompletionRequest): ChatCompletionResponse {
        val url = "${baseUrl.trimEnd('/')}/chat/completions"
        val body = json.encodeToString(request).toRequestBody("application/json".toMediaType())

        val okhttpRequest = okhttp3.Request.Builder()
            .url(url)
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .apply {
                if (apiKey != null) {
                    header("Authorization", "Bearer $apiKey")
                }
            }
            .post(body)
            .build()

        return okHttpClient.newCall(okhttpRequest).execute().use { response ->
            if (!response.isSuccessful) {
                val errorBody = response.body?.string() ?: "No error body"
                throw OpenAiHttpClientError(
                    "HTTP ${response.code}: $errorBody",
                    response.code,
                )
            }

            val responseBody = response.body?.string()
                ?: throw OpenAiHttpClientError("Empty response body", 500)

            json.decodeFromString<ChatCompletionResponse>(responseBody)
        }
    }

    /**
     * Check server connectivity with a minimal request.
     */
    suspend fun ping(): Boolean {
        return try {
            val request = ChatCompletionRequest(
                model = "",
                messages = listOf(ChatMessage(role = "user", content = "")),
                maxTokens = 1,
                stream = false,
            )
            chatCompletion(request)
            true
        } catch (e: Exception) {
            false
        }
    }
}

/**
 * Error thrown by [OpenAiHttpClient] for HTTP-level failures.
 */
class OpenAiHttpClientError(message: String, val status: Int) : Exception(message)
