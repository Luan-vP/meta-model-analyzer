package com.luanvp.metamodel.keyboard.network

import kotlinx.serialization.Serializable

/**
 * OpenAI-compatible chat completion protocol types.
 *
 * Minimal subset of the OpenAI Chat Completions API, covering sync and
 * streaming completions. Compatible with Ollama (/v1), LM Studio, LiteLLM,
 * vLLM, and any server implementing the OpenAI-compatible endpoint.
 *
 * Mirrors keyboard/protocol/openai.ts.
 */

// ── Request ──────────────────────────────────────────────────────────

@Serializable
data class ChatMessage(
    val role: String,        // "system" | "user" | "assistant" | "tool"
    val content: String?,
    val toolCallId: String? = null,
    val toolCalls: List<ToolCall>? = null,
)

@Serializable
data class ToolCall(
    val id: String,
    val `type`: String = "function",
    val function: ToolCallFunction,
)

@Serializable
data class ToolCallFunction(
    val name: String,
    val arguments: String,  // JSON-encoded
)

@Serializable
data class ChatCompletionRequest(
    val model: String,
    val messages: List<ChatMessage>,
    val temperature: Double? = null,
    val maxTokens: Int? = null,
    val stream: Boolean = false,
    val responseFormat: ResponseFormat? = null,
    /** Ollama-specific shorthand for JSON mode. */
    val format: String? = null,
)

@Serializable
data class ResponseFormat(
    val type: String = "json_schema",
    val jsonSchema: JsonSchema? = null,
)

@Serializable
data class JsonSchema(
    val name: String,
    val schema: Map<String, Any>,
)

// ── Response (non-streaming) ─────────────────────────────────────────

@Serializable
data class ChatCompletionResponse(
    val id: String,
    val `object`: String,
    val created: Long,
    val model: String,
    val choices: List<ChatCompletionChoice>,
    val usage: CompletionUsage? = null,
)

@Serializable
data class ChatCompletionChoice(
    val index: Int,
    val message: ChatMessage,
    val finishReason: String? = null,
)

@Serializable
data class CompletionUsage(
    val promptTokens: Int,
    val completionTokens: Int,
    val totalTokens: Int,
)
