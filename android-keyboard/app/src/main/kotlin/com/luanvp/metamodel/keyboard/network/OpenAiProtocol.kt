package com.luanvp.metamodel.keyboard.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * OpenAI-compatible chat completion protocol types.
 * Mirrors keyboard/protocol/openai.ts.
 */

@Serializable
data class ChatMessage(
    val role: String,
    val content: String?,
    @SerialName("tool_call_id") val toolCallId: String? = null,
    @SerialName("tool_calls") val toolCalls: List<ToolCall>? = null,
)

@Serializable
data class ToolCall(
    val id: String,
    val type: String = "function",
    val function: ToolCallFunction,
)

@Serializable
data class ToolCallFunction(
    val name: String,
    val arguments: String,
)

@Serializable
data class ChatCompletionRequest(
    val model: String,
    val messages: List<ChatMessage>,
    val temperature: Double? = null,
    @SerialName("max_tokens") val maxTokens: Int? = null,
    val stream: Boolean = false,
    @SerialName("response_format") val responseFormat: ResponseFormat? = null,
    val format: String? = null,
)

@Serializable
data class ResponseFormat(
    val type: String = "json_schema",
    @SerialName("json_schema") val jsonSchema: Map<String, String>? = null,
)

@Serializable
data class ChatCompletionResponse(
    val id: String,
    @SerialName("object") val responseObject: String,
    val created: Long,
    val model: String,
    val choices: List<ChatCompletionChoice>,
    val usage: CompletionUsage? = null,
)

@Serializable
data class ChatCompletionChoice(
    val index: Int,
    val message: ChatMessage,
    @SerialName("finish_reason") val finishReason: String? = null,
)

@Serializable
data class CompletionUsage(
    @SerialName("prompt_tokens") val promptTokens: Int,
    @SerialName("completion_tokens") val completionTokens: Int,
    @SerialName("total_tokens") val totalTokens: Int,
)
