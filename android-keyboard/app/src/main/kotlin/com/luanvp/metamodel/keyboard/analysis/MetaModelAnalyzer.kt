package com.luanvp.metamodel.keyboard.analysis

import com.luanvp.metamodel.keyboard.network.ChatCompletionRequest
import com.luanvp.metamodel.keyboard.network.ChatMessage
import com.luanvp.metamodel.keyboard.network.OpenAiHttpClient
import com.luanvp.metamodel.keyboard.settings.KeyboardSettings
import kotlinx.serialization.json.Json

/**
 * Core analysis pipeline: prompt → HTTP → parse → validate → resolve offsets.
 *
 * Mirrors core/application/analyze-text.ts + core/application/prompt.ts.
 */
class MetaModelAnalyzer(
    private val okHttpClient: okhttp3.OkHttpClient,
    private val settings: KeyboardSettings,
) {

    private val httpClient = OpenAiHttpClient(
        baseUrl = settings.getServerUrl(),
        okHttpClient = okHttpClient,
        apiKey = settings.getApiKey(),
    )

    private val json = Json {
        ignoreUnknownKeys = true
        lenient = true
    }

    /**
     * Run the full Meta-Model analysis on [text].
     * Returns a list of validated annotations with resolved character offsets.
     */
    suspend fun analyze(text: String): List<Annotation> {
        val rawResponse = complete(text)
        val parsed = parseAnnotationsJson(rawResponse)
        val validated = validateAnnotations(parsed)
        return resolveOffsets(text, validated)
    }

    // ── Prompt + HTTP ────────────────────────────────────────────────

    private suspend fun complete(text: String): String {
        val request = ChatCompletionRequest(
            model = settings.getModelName(),
            messages = listOf(
                ChatMessage(role = "system", content = PromptBuilder.SYSTEM_PROMPT),
                ChatMessage(role = "user", content = PromptBuilder.buildUserMessage(text)),
            ),
            temperature = 0.1,
            stream = false,
            format = "json",
        )

        val response = httpClient.chatCompletion(request)
        val content = response.choices.firstOrNull()?.message?.content
            ?: throw IllegalStateException("Empty LLM response")
        return content
    }

    // ── JSON parsing ─────────────────────────────────────────────────

    /**
     * Parse the LLM's raw text response into a list of RawAnnotation.
     * Handles markdown code fences, prose wrapping, and reasoning tags.
     *
     * Mirrors parseAnnotationsJSON from core/application/prompt.ts.
     */
    private fun parseAnnotationsJson(raw: String): List<RawAnnotation> {
        var text = raw.trim()

        // Strip thinking/reasoning tags (Qwen3 etc.)
        text = text.replace(Regex("<think>[\\s\\S]*?</think>", RegexOption.IGNORE_CASE), "").trim()

        val attempts = mutableListOf<String>()
        attempts += text

        // Markdown code fence
        val fenceMatch = Regex("```(?:json)?\\s*([\\s\\S]*?)```").find(text)
        fenceMatch?.groupValues?.get(1)?.let { attempts += it.trim() }

        // First { to last }
        val firstBrace = text.indexOf('{')
        val lastBrace = text.lastIndexOf('}')
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            attempts += text.substring(firstBrace, lastBrace + 1)
        }

        for (candidate in attempts) {
            // Try parsing as LlmResponse wrapper
            try {
                val wrapper = json.decodeFromString<LlmResponse>(candidate)
                if (wrapper.annotations.isNotEmpty()) return wrapper.annotations
            } catch (_: Exception) {
                // fall through
            }

            // Try parsing as raw array
            try {
                val arrayStr = if (candidate.startsWith('[')) candidate else "[${candidate.removePrefix('{').removeSuffix('}')}]"
                val list = json.decodeFromString<List<RawAnnotation>>(arrayStr)
                if (list.isNotEmpty()) return list
            } catch (_: Exception) {
                // fall through
            }
        }

        android.util.Log.e("MetaModelAnalyzer", "Could not parse LLM JSON response: $raw")
        return emptyList()
    }

    // ── Validation ───────────────────────────────────────────────────

    /**
     * Keep only annotations whose violationType and category are valid enum values.
     * Mirrors validateAnnotations from core/application/analyze-text.ts.
     */
    private fun validateAnnotations(raw: List<RawAnnotation>): List<RawAnnotation> {
        return raw.filter { a ->
            ViolationType.fromValue(a.violationType) != null &&
                ViolationCategory.fromValue(a.category) != null
        }
    }

    // ── Offset resolution ────────────────────────────────────────────

    /**
     * Resolve each raw annotation's substring to character offsets in the
     * original text. Applies fuzzy fallback (trim, case-insensitive) and
     * removes overlaps. Mirrors resolveOffsets from core/application/prompt.ts.
     */
    private fun resolveOffsets(
        originalText: String,
        rawAnnotations: List<RawAnnotation>,
    ): List<Annotation> {
        val resolved = mutableListOf<Annotation>()
        var searchFrom = 0

        for (raw in rawAnnotations) {
            val violationType = ViolationType.fromValue(raw.violationType)
                ?: continue
            val category = raw.violationType.let { ViolationType.fromValue(it)?.category }
                ?: ViolationCategory.fromValue(raw.category)
                ?: continue

            var startIdx = findSubstring(originalText, raw.text, searchFrom)
            var resolvedText = raw.text

            if (startIdx == -1) {
                // Fuzzy fallback: trimmed
                val trimmed = raw.text.trim()
                if (trimmed != raw.text) {
                    startIdx = findSubstring(originalText, trimmed, searchFrom)
                    resolvedText = trimmed
                }
            }

            if (startIdx == -1) {
                // Fuzzy fallback: case-insensitive
                startIdx = findSubstringCaseInsensitive(originalText, raw.text, searchFrom)
                if (startIdx >= 0) {
                    resolvedText = originalText.substring(
                        startIdx,
                        startIdx + raw.text.length,
                    )
                }
            }

            if (startIdx == -1) {
                android.util.Log.w(
                    "MetaModelAnalyzer",
                    "Could not find substring, skipping: \"${raw.text}\"",
                )
                continue
            }

            val endIdx = startIdx + resolvedText.length

            // Check for overlap with previous annotations
            val overlaps = resolved.any { a ->
                startIdx < a.endOffset && endIdx > a.startOffset
            }
            if (overlaps) {
                android.util.Log.w(
                    "MetaModelAnalyzer",
                    "Skipping overlapping annotation: \"${resolvedText}\"",
                )
                continue
            }

            resolved += Annotation(
                startOffset = startIdx,
                endOffset = endIdx,
                text = resolvedText,
                violationType = violationType,
                category = category,
                challengeQuestion = raw.challengeQuestion,
            )

            searchFrom = endIdx
        }

        return resolved.sortedBy { it.startOffset }
    }

    private fun findSubstring(text: String, substr: String, fromIndex: Int): Int {
        return text.indexOf(substr, fromIndex)
    }

    private fun findSubstringCaseInsensitive(
        text: String,
        substr: String,
        fromIndex: Int,
    ): Int {
        val lowerText = text.lowercase()
        val lowerSub = substr.lowercase()
        return lowerText.indexOf(lowerSub, fromIndex)
    }
}
