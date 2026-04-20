#!/usr/bin/env bash
# Creates .claude/skills/distortions/SKILL.md from the content bundled below.
# Run once: bash install-skill.sh
set -euo pipefail
TARGET=".claude/skills/distortions/SKILL.md"
mkdir -p "$(dirname "$TARGET")"
cat > "$TARGET" << 'SKILL_CONTENT'
# NLP Meta-Model Distortions Skill

**description**: Identify, explain, and challenge NLP Meta-Model violations — the linguistic patterns catalogued in "The Structure of Magic" by Bandler and Grinder. Trigger this skill when the user asks about: meta-model violations, linguistic distortions/deletions/generalizations, challenge questions for NLP, Bandler and Grinder, "The Structure of Magic", mind reading / cause-effect / lost-performative / nominalization / modal operators / universal quantifiers / presuppositions / referential index patterns, or annotating text for NLP violations.

---

## 1. Taxonomy Overview

Meta-Model violations fall into three mutually exclusive categories. Each violation type belongs to **exactly one** category — do not reassign types across categories.

### deletion
Information is missing from the surface structure of the sentence.

| Type | displayName |
|------|-------------|
| `simple-deletion` | Simple Deletion |
| `comparative-deletion` | Comparative Deletion |
| `lack-of-referential-index` | Lack of Referential Index |
| `unspecified-verb` | Unspecified Verb |

### generalization
A specific experience has been over-extended into a universal pattern or rule.

| Type | displayName |
|------|-------------|
| `universal-quantifier` | Universal Quantifier |
| `modal-operator-necessity` | Modal Operator of Necessity |
| `modal-operator-possibility` | Modal Operator of Possibility |
| `nominalization` | Nominalization |

### distortion
Meaning is twisted — causal links assumed, thoughts attributed, or equivalences invented.

| Type | displayName |
|------|-------------|
| `cause-effect` | Cause-Effect |
| `mind-reading` | Mind Reading |
| `lost-performative` | Lost Performative |
| `complex-equivalence` | Complex Equivalence |
| `presupposition` | Presupposition |

> **Category-correctness is load-bearing.** Do NOT place modal operators or nominalizations under `distortion`. Do NOT place cause-effect or mind-reading under `deletion` or `generalization`.

---

## 2. Per-Distortion Reference (13 types)

### deletion — Simple Deletion (`simple-deletion`)

**Description**: Important information is left out of the surface structure.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "I'm upset." | Upset about what specifically? |
| "I'm scared and I don't know what to do." | Scared of what specifically? |
| "I'm worried." | Worried about what? About whom? |

---

### deletion — Comparative Deletion (`comparative-deletion`)

**Description**: A comparison is made but the standard of comparison is deleted.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "She's better." | Better than whom? Better than what, specifically? |
| "Things are getting worse and worse." | Worse compared to what? Worse than when? |
| "It's more difficult now." | More difficult than what? More difficult compared to when? |

---

### deletion — Lack of Referential Index (`lack-of-referential-index`)

**Description**: A noun phrase does not refer to a specific person or thing.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "They don't understand." | Who specifically doesn't understand? |
| "Someone told me I should quit." | Who specifically told you that? |
| "People don't like me." | Which people specifically don't like you? |

---

### deletion — Unspecified Verb (`unspecified-verb`)

**Description**: The verb does not specify how the action was performed.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "He hurt me." | How specifically did he hurt you? |
| "They rejected me." | How specifically did they reject you? |
| "My parents mistreated me as a child." | How specifically did they mistreat you? |

---

### generalization — Universal Quantifier (`universal-quantifier`)

**Description**: Words like "always", "never", "everyone", "nobody", "all", "every", "none" that overgeneralize.

**Signal words**: always, never, everyone, nobody, all, every, none, anything, everything, nothing

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "Everyone always ignores me." | Everyone? Always? Has there ever been a time someone listened? |
| "Nobody ever listens to what I say." | Nobody? Has there ever been even one person who listened? |
| "I never get anything right." | Never? Every single time without exception? |

---

### generalization — Modal Operator of Necessity (`modal-operator-necessity`)

**Description**: Words like "must", "have to", "should", "need to", "ought to" implying no choice exists.

**Signal words**: must, have to, should, need to, ought to, required to, supposed to

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "I have to be perfect." | What would happen if you weren't perfect? What stops you from choosing differently? |
| "You should never show weakness." | What would happen if you did show weakness? Says who? |
| "I must keep going no matter what." | What would happen if you stopped? What prevents you from pausing? |

---

### generalization — Modal Operator of Possibility (`modal-operator-possibility`)

**Description**: Words like "can't", "impossible", "unable" implying impossibility.

**Signal words**: can't, cannot, couldn't, impossible, unable, it's not possible

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "I can't change." | What prevents you from changing? What would happen if you could? |
| "It's impossible to be happy in this situation." | What makes it impossible? What would it take for it to become possible? |
| "I'm unable to trust anyone after what happened." | What specifically prevents you from trusting? What would need to happen for trust to become possible? |

---

### generalization — Nominalization (`nominalization`)

**Description**: A process (verb) has been turned into a static noun/thing, concealing the ongoing nature of the experience.

**How to spot it**: If you can put "ongoing" or "the act of" in front of it, it is probably a nominalization. (e.g. "our *relationship*" is really "the ongoing *relating*"; "my *frustration*" is really "the ongoing *frustrating*").

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "Our relationship needs work." | How specifically are you relating to each other right now? |
| "My frustration is overwhelming." | What specifically are you frustrated about? How are you frustrating yourself? |
| "The decision was final and there was no discussion." | Who decided, and how? Who discussed what, with whom? |

---

### distortion — Cause-Effect (`cause-effect`)

**Description**: An assumed causal link between two events that may not be connected — one thing is said to *make* or *cause* another person's internal state.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "He makes me so angry." | How exactly does what he does cause you to choose anger? Has he ever done that without you becoming angry? |
| "The weather ruins my mood every time." | How specifically does the weather control your mood? |
| "Her silence caused my anxiety." | How specifically does her silence cause your anxiety? Has she ever been silent without you feeling anxious? |

---

### distortion — Mind Reading (`mind-reading`)

**Description**: Claiming to know another person's internal state — thoughts, feelings, intentions — without observable evidence.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "She thinks I'm stupid." | How do you know what she thinks? What specifically makes you believe that? |
| "My boss hates me." | How do you know your boss hates you? What specific evidence leads you to that conclusion? |
| "They all know I'm a fraud." | How do you know what they know? What specifically makes you think they believe that? |

---

### distortion — Lost Performative (`lost-performative`)

**Description**: A value judgment where the performer of the judgment is missing — a rule or evaluation presented as objective fact with no attributed source.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "It's wrong to be selfish." | Wrong according to whom? Who decided that? |
| "That's the right way to do it." | Right according to whom? By whose standard? |
| "It's bad to show emotions at work." | Bad according to whom? Who says that, and how do you know it's true? |

---

### distortion — Complex Equivalence (`complex-equivalence`)

**Description**: Two experiences are equated as meaning the same thing — X is taken to mean Y without justification.

**Signal structure**: "X, so Y"; "X means Y"; "X, which means Y"

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "He didn't call, so he doesn't care." | How does not calling mean not caring? Have you ever not called someone you do care about? |
| "She's quiet, which means she's angry." | How does being quiet mean being angry? Has she ever been quiet without being angry? |
| "You're late, so you obviously don't respect my time." | How does being late mean not respecting your time? Have you ever been late for a reason unrelated to respect? |

---

### distortion — Presupposition (`presupposition`)

**Description**: An unstated assumption embedded in the sentence that must be accepted for the sentence to make sense.

**How to spot it**: Ask what must already be true for the statement to be a valid question or assertion.

**Canonical examples**

| Input | Challenge |
|-------|-----------|
| "If she really loved me, she'd know what I need." | What leads you to believe that love means knowing someone's needs without being told? |
| "Why are you always so difficult?" | What leads you to presuppose you are always difficult? When did I agree that was true? |
| "When will you stop making the same mistakes?" | What leads you to presuppose you are making repeated mistakes? |

---

## 3. Usage Guidance for Claude

When analyzing text for Meta-Model violations, follow these rules exactly.

### Annotation-first behaviour
1. Identify each violation span in the text before generating any challenge question.
2. Extract the **exact substring** from the input — character-for-character. Do not paraphrase or expand the span.
3. Sort annotations by order of appearance in the input.
4. Make challenge questions **specific** to the actual text — do not use generic templates verbatim.

### Category/type coherence
- Every `violationType` maps to exactly one `category` (see Taxonomy Overview above).
- Never assign `modal-operator-necessity`, `modal-operator-possibility`, or `nominalization` to category `distortion`.
- Never assign `cause-effect`, `mind-reading`, `lost-performative`, `complex-equivalence`, or `presupposition` to category `deletion` or `generalization`.

### Empty-array rule
If the text contains no Meta-Model violations — that is, statements are specific, well-referenced, and free of hidden assumptions — return an **empty annotations array**. Well-formed, factual, specific statements are NOT violations.

> Example clean text: "Sarah called me at 3pm to discuss the project timeline. We agreed to meet on Thursday." → no violations.

### No invented types
The 13 violation types listed above are canonical (mirrored from `ViolationType` in `src/types/analysis.ts`). Do not invent new types or sub-types.

---

## 4. JSON Schema Reference

When structured output is needed, validate against this schema:

```json
{
  "type": "object",
  "properties": {
    "annotations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "description": "Exact substring from the original text"
          },
          "violationType": {
            "type": "string",
            "enum": [
              "simple-deletion",
              "comparative-deletion",
              "lack-of-referential-index",
              "unspecified-verb",
              "universal-quantifier",
              "modal-operator-necessity",
              "modal-operator-possibility",
              "nominalization",
              "cause-effect",
              "mind-reading",
              "lost-performative",
              "complex-equivalence",
              "presupposition"
            ]
          },
          "category": {
            "type": "string",
            "enum": ["deletion", "generalization", "distortion"]
          },
          "challengeQuestion": {
            "type": "string",
            "description": "A specific Meta-Model challenge question"
          }
        },
        "required": ["text", "violationType", "category", "challengeQuestion"]
      }
    }
  },
  "required": ["annotations"]
}
```

### Example output

Input: `"Nobody listens to me and I can't ever be heard."`

```json
{
  "annotations": [
    {
      "text": "Nobody",
      "violationType": "universal-quantifier",
      "category": "generalization",
      "challengeQuestion": "Nobody? Has there ever been even one person who listened to you?"
    },
    {
      "text": "can't ever be heard",
      "violationType": "modal-operator-possibility",
      "category": "generalization",
      "challengeQuestion": "What prevents you from being heard? What would need to happen for you to feel heard?"
    }
  ]
}
```
SKILL_CONTENT
echo "Skill installed at: $TARGET"
