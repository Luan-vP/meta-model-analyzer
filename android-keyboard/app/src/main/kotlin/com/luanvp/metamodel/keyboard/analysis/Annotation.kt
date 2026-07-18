package com.luanvp.metamodel.keyboard.analysis

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * A single Meta-Model annotation (violation found in text).
 * Mirrors core/domain/annotation.ts.
 */
data class Annotation(
    val startOffset: Int,
    val endOffset: Int,
    val text: String,
    val violationType: ViolationType,
    val category: ViolationCategory,
    val challengeQuestion: String,
)

/**
 * Raw annotation parsed from LLM JSON response (before offset resolution).
 * Mirrors core/application/prompt.ts RawAnnotation.
 */
@Serializable
data class RawAnnotation(
    val text: String,
    @SerialName("violationType") val violationType: String,
    @SerialName("category") val category: String,
    @SerialName("challengeQuestion") val challengeQuestion: String,
)

/**
 * Expected JSON structure from the LLM.
 */
@Serializable
data class LlmResponse(
    val annotations: List<RawAnnotation> = emptyList(),
)
