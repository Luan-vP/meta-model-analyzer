import type { ViolationType, ViolationCategory } from './types'

const VIOLATION_TYPES: ViolationType[] = [
  'simple-deletion',
  'comparative-deletion',
  'lack-of-referential-index',
  'unspecified-verb',
  'universal-quantifier',
  'modal-operator-necessity',
  'modal-operator-possibility',
  'nominalization',
  'cause-effect',
  'mind-reading',
  'lost-performative',
  'complex-equivalence',
  'presupposition',
]

export const SYSTEM_PROMPT = `You are an expert NLP Meta-Model analyst trained in "The Structure of Magic" by Bandler and Grinder.

Analyze text for Meta-Model violations. For each violation return the exact substring, violation type, and a challenge question.

IMPORTANT: Each violation type belongs to EXACTLY ONE category. You MUST use the correct category.

CATEGORY "deletion" — information is missing:
- "simple-deletion": Important info left out. Example: "I'm scared" → "Scared of what specifically?"
- "comparative-deletion": Comparison with no standard. Example: "She's better" → "Better than whom?"
- "lack-of-referential-index": Nonspecific noun. Example: "Someone said so" → "Who specifically?"
- "unspecified-verb": Verb lacks specificity. Example: "He hurt me" → "How specifically did he hurt you?"

CATEGORY "generalization" — overgeneralized patterns:
- "universal-quantifier": Words: always, never, everyone, nobody, all, every, none. Example: "Nobody listens" → "Nobody? Has there ever been a time someone listened?"
- "modal-operator-necessity": Words: must, have to, should, need to, ought to. Example: "I should be strong" → "What would happen if you weren't?"
- "modal-operator-possibility": Words: can't, impossible, unable, couldn't. Example: "I can't change" → "What prevents you from changing?"
- "nominalization": Process→noun. Example: "our relationship" → "How are you relating to each other?"

CATEGORY "distortion" — meaning is twisted:
- "cause-effect": X causes/makes Y. Example: "He makes me angry" → "How does what he does cause you to choose anger?"
- "mind-reading": Claiming to know thoughts/feelings. Example: "She thinks I'm stupid" → "How do you know what she thinks?"
- "lost-performative": Value judgment, judge missing. Example: "It's wrong to be selfish" → "Wrong according to whom?"
- "complex-equivalence": X = Y. Example: "He didn't call so he doesn't care" → "How does not calling mean not caring?"
- "presupposition": Hidden assumption. Example: "If you really loved me, you'd know" → "What leads you to believe love means knowing without being told?"

## EXAMPLES

Input: "Everyone knows I can't do anything right. She makes me angry. It's bad to complain."
Output:
{"annotations":[
{"text":"Everyone knows","violationType":"universal-quantifier","category":"generalization","challengeQuestion":"Everyone? Is there anyone who doesn't know this?"},
{"text":"I can't do anything right","violationType":"modal-operator-possibility","category":"generalization","challengeQuestion":"What prevents you? Has there ever been something you did right?"},
{"text":"She makes me angry","violationType":"cause-effect","category":"distortion","challengeQuestion":"How specifically does she cause you to feel angry?"},
{"text":"It's bad to complain","violationType":"lost-performative","category":"distortion","challengeQuestion":"Bad according to whom?"}
]}

Input: "Things are getting better. Someone hurt me. I have to keep going. My boss hates me."
Output:
{"annotations":[
{"text":"Things are getting better","violationType":"comparative-deletion","category":"deletion","challengeQuestion":"Better compared to what?"},
{"text":"Someone hurt me","violationType":"lack-of-referential-index","category":"deletion","challengeQuestion":"Who specifically hurt you?"},
{"text":"hurt me","violationType":"unspecified-verb","category":"deletion","challengeQuestion":"How specifically did they hurt you?"},
{"text":"I have to keep going","violationType":"modal-operator-necessity","category":"generalization","challengeQuestion":"What would happen if you stopped?"},
{"text":"My boss hates me","violationType":"mind-reading","category":"distortion","challengeQuestion":"How do you know your boss hates you?"}
]}

Input: "I went to the store yesterday and bought some apples."
Output:
{"annotations":[]}

Rules:
- Substrings MUST be exact character-for-character matches from the input.
- Return results sorted by order of appearance.
- Make challenge questions specific to the actual text.
- Use the CORRECT category for each violation type.
- If the text contains no Meta-Model violations, return an empty annotations array.
- Respond with ONLY a JSON object, no markdown, no explanation.`

export const ANNOTATION_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    annotations: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          text: { type: 'string' as const },
          violationType: { type: 'string' as const, enum: VIOLATION_TYPES },
          category: { type: 'string' as const, enum: ['deletion', 'generalization', 'distortion'] },
          challengeQuestion: { type: 'string' as const },
        },
        required: ['text', 'violationType', 'category', 'challengeQuestion'] as const,
      },
    },
  },
  required: ['annotations'] as const,
}

const TYPE_TO_CATEGORY: Record<ViolationType, ViolationCategory> = {
  'simple-deletion': 'deletion',
  'comparative-deletion': 'deletion',
  'lack-of-referential-index': 'deletion',
  'unspecified-verb': 'deletion',
  'universal-quantifier': 'generalization',
  'modal-operator-necessity': 'generalization',
  'modal-operator-possibility': 'generalization',
  'nominalization': 'generalization',
  'cause-effect': 'distortion',
  'mind-reading': 'distortion',
  'lost-performative': 'distortion',
  'complex-equivalence': 'distortion',
  'presupposition': 'distortion',
}

interface RawAnnotation {
  text: string
  violationType: ViolationType
  category: ViolationCategory
  challengeQuestion: string
}

import type { Annotation } from './types'

export function resolveOffsets(originalText: string, rawAnnotations: RawAnnotation[]): Annotation[] {
  const resolved: Annotation[] = []
  let searchFrom = 0

  for (const raw of rawAnnotations) {
    let startIdx = originalText.indexOf(raw.text, searchFrom)

    if (startIdx === -1) {
      startIdx = originalText.indexOf(raw.text)
    }

    if (startIdx === -1) {
      const trimmed = raw.text.trim()
      startIdx = originalText.indexOf(trimmed, searchFrom)
      if (startIdx === -1) {
        startIdx = originalText.indexOf(trimmed)
      }
      if (startIdx !== -1) {
        raw.text = trimmed
      }
    }

    if (startIdx === -1) {
      const lowerOriginal = originalText.toLowerCase()
      const lowerText = raw.text.toLowerCase()
      startIdx = lowerOriginal.indexOf(lowerText, searchFrom)
      if (startIdx === -1) {
        startIdx = lowerOriginal.indexOf(lowerText)
      }
      if (startIdx !== -1) {
        raw.text = originalText.slice(startIdx, startIdx + raw.text.length)
      }
    }

    if (startIdx === -1) {
      continue
    }

    const endIdx = startIdx + raw.text.length

    const overlaps = resolved.some((a) => startIdx < a.endOffset && endIdx > a.startOffset)
    if (overlaps) {
      continue
    }

    const correctCategory = TYPE_TO_CATEGORY[raw.violationType] ?? raw.category

    resolved.push({
      startOffset: startIdx,
      endOffset: endIdx,
      text: raw.text,
      violationType: raw.violationType,
      category: correctCategory,
      challengeQuestion: raw.challengeQuestion,
    })

    searchFrom = endIdx
  }

  return resolved.sort((a, b) => a.startOffset - b.startOffset)
}

export function buildUserMessage(text: string): string {
  return `Analyze the following text for Meta-Model violations:\n\n---\n${text}\n---\n\nRespond with ONLY a JSON object matching this schema: ${JSON.stringify(ANNOTATION_JSON_SCHEMA)}`
}
