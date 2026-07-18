package com.luanvp.metamodel.keyboard.analysis

/**
 * Meta-Model violation types. Mirrors core/domain/annotation.ts.
 */
enum class ViolationType(
    val value: String,
    val category: ViolationCategory,
) {
    // Deletions
    SIMPLE_DELETION("simple-deletion", ViolationCategory.DELETION),
    COMPARATIVE_DELETION("comparative-deletion", ViolationCategory.DELETION),
    LACK_OF_REFERENTIAL_INDEX("lack-of-referential-index", ViolationCategory.DELETION),
    UNSPECIFIED_VERB("unspecified-verb", ViolationCategory.DELETION),

    // Generalizations
    UNIVERSAL_QUANTIFIER("universal-quantifier", ViolationCategory.GENERALIZATION),
    MODAL_OPERATOR_NECESSITY("modal-operator-necessity", ViolationCategory.GENERALIZATION),
    MODAL_OPERATOR_POSSIBILITY("modal-operator-possibility", ViolationCategory.GENERALIZATION),
    NOMINALIZATION("nominalization", ViolationCategory.GENERALIZATION),

    // Distortions
    CAUSE_EFFECT("cause-effect", ViolationCategory.DISTORTION),
    MIND_READING("mind-reading", ViolationCategory.DISTORTION),
    LOST_PERFORMATIVE("lost-performative", ViolationCategory.DISTORTION),
    COMPLEX_EQUIVALENCE("complex-equivalence", ViolationCategory.DISTORTION),
    PRESUPPOSITION("presupposition", ViolationCategory.DISTORTION),
    ;

    companion object {
        private val BY_VALUE = entries.associateBy { it.value }

        fun fromValue(value: String): ViolationType? = BY_VALUE[value]
    }
}

/**
 * Top-level violation categories.
 */
enum class ViolationCategory(val value: String) {
    DELETION("deletion"),
    GENERALIZATION("generalization"),
    DISTORTION("distortion"),
    ;

    companion object {
        private val BY_VALUE = entries.associateBy { it.value }

        fun fromValue(value: String): ViolationCategory? = BY_VALUE[value]
    }
}
