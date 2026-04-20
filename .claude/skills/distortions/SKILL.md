---
name: distortions
description: Identify, explain, and challenge NLP Meta-Model violations — the linguistic distortions, deletions, and generalizations catalogued in "The Structure of Magic" by Bandler and Grinder. Trigger when the user asks about meta-model violations, linguistic distortions, deletions, generalizations, challenge questions, Bandler and Grinder, The Structure of Magic, mind reading, cause-effect, lost performative, nominalization, modal operators, universal quantifiers, presuppositions, referential index, or annotating text for NLP violations.
---

# NLP Meta-Model Distortions

This skill distils the contents of the `meta-model-analyzer` repo — its violation catalogue, system prompt rules, and benchmark examples — into a single reference Claude Code can load on demand when working with NLP Meta-Model analysis.

## 1. Taxonomy

Meta-Model violations fall into **three mutually exclusive categories**. Every violation type belongs to exactly one category. Do not reassign types across categories.

### deletion — information is missing
- `simple-deletion` — Simple Deletion
- `comparative-deletion` — Comparative Deletion
- `lack-of-referential-index` — Lack of Referential Index
- `unspecified-verb` — Unspecified Verb

### generalization — a specific experience has been over-extended into a universal rule
- `universal-quantifier` — Universal Quantifier
- `modal-operator-necessity` — Modal Operator of Necessity
- `modal-operator-possibility` — Modal Operator of Possibility
- `nominalization` — Nominalization

### distortion — meaning is twisted (causal links assumed, thoughts attributed, equivalences invented)
- `cause-effect` — Cause-Effect
- `mind-reading` — Mind Reading
- `lost-performative` — Lost Performative
- `complex-equivalence` — Complex Equivalence
- `presupposition` — Presupposition

Category-correctness is load-bearing. Do NOT place modal operators or nominalizations under `distortion`. Do NOT place cause-effect, mind-reading, lost-performative, complex-equivalence, or presupposition under `deletion` or `generalization`.

---

## 2. The 13 distortion types

### deletion — Simple Deletion (`simple-deletion`)

Important information is left out of the surface structure.

**Signal**: short emotion or state statements with no object ("I'm scared", "I'm confused").

**Examples**

| Input | Challenge |
|-------|-----------|
| "I'm upset." | About what specifically? |
| "I'm scared and I don't know what to do." | Scared of what specifically? |
| "I'm worried." | Worried about what? About whom? |

---

### deletion — Comparative Deletion (`comparative-deletion`)

A comparison is made but the standard of comparison is deleted.

**Signal words**: better, worse, more, less, harder, easier, cheaper, richer, richer than…

**Examples**

| Input | Challenge |
|-------|-----------|
| "She's better." | Better than whom? Better at what, specifically? |
| "Things are getting worse and worse." | Worse compared to what? Worse than when? |
| "It's more difficult now." | More difficult than what? More difficult than when? |

---

### deletion — Lack of Referential Index (`lack-of-referential-index`)

A noun phrase does not refer to a specific person or thing.

**Signal words**: they, people, someone, somebody, them, one, folks, everybody (when used non-specifically).

**Examples**

| Input | Challenge |
|-------|-----------|
| "They don't understand." | Who specifically doesn't understand? |
| "Someone told me I should quit." | Who specifically told you that? |
| "People don't like me." | Which people specifically? |

---

### deletion — Unspecified Verb (`unspecified-verb`)

The verb does not specify how the action was performed.

**Signal words**: hurt, reject, mistreat, disrespect, help, support, love, ignore — any verb that describes an action without describing the mechanism.

**Examples**

| Input | Challenge |
|-------|-----------|
| "He hurt me." | How specifically did he hurt you? |
| "They rejected me." | How specifically did they reject you? |
| "My parents mistreated me as a child." | How specifically did they mistreat you? |

---

### generalization — Universal Quantifier (`universal-quantifier`)

Words that overgeneralize by claiming a pattern with no exceptions.

**Signal words**: always, never, everyone, nobody, no one, all, every, none, anything, everything, nothing, anywhere.

**Examples**

| Input | Challenge |
|-------|-----------|
| "Everyone always ignores me." | Everyone? Always? Has there ever been a time someone didn't ignore you? |
| "Nobody ever listens to what I say." | Nobody? Has there ever been even one person who listened? |
| "I never get anything right." | Never? Every single time without exception? |
| "All men are the same." | All of them? Have you ever met a man who was different? |

---

### generalization — Modal Operator of Necessity (`modal-operator-necessity`)

Words that imply there is no choice — a rule that must be followed.

**Signal words**: must, have to, has to, should, shouldn't, need to, ought to, required to, supposed to.

**Examples**

| Input | Challenge |
|-------|-----------|
| "I have to be perfect." | What would happen if you weren't? What stops you from choosing differently? |
| "You should never show weakness." | Should according to whom? What would happen if you did? |
| "I must keep going no matter what." | What would happen if you stopped? What prevents a pause? |

---

### generalization — Modal Operator of Possibility (`modal-operator-possibility`)

Words that claim something is impossible or unavailable.

**Signal words**: can't, cannot, couldn't, impossible, unable, not possible, no way.

**Examples**

| Input | Challenge |
|-------|-----------|
| "I can't change." | What prevents you from changing? What would happen if you could? |
| "It's impossible to be happy in this situation." | What specifically makes it impossible? What would need to change? |
| "I'm unable to trust anyone after what happened." | What specifically prevents trust? What would need to happen? |

---

### generalization — Nominalization (`nominalization`)

A process (verb) has been turned into a static noun, concealing the ongoing nature of the experience.

**How to spot it**: if you can put "the act of" or "ongoing" in front of the word and it still makes sense, it is probably a nominalization ("the ongoing *relating*", "the act of *deciding*"). Common examples: relationship, communication, frustration, decision, discussion, education, freedom, respect.

**Examples**

| Input | Challenge |
|-------|-----------|
| "Our relationship needs work." | How specifically are you relating to each other? |
| "My frustration is overwhelming." | What specifically are you frustrated about? How are you frustrating yourself? |
| "The decision was final and there was no discussion." | Who decided, how? Who discussed what, with whom? |

---

### distortion — Cause-Effect (`cause-effect`)

An assumed causal link between an external event and an internal state — one thing is said to *make* or *cause* another person's feelings.

**Signal structure**: "X makes me Y", "X causes Y", "because of X, I…"

**Examples**

| Input | Challenge |
|-------|-----------|
| "He makes me so angry." | How exactly does what he does cause you to choose anger? |
| "The weather ruins my mood every time." | How specifically does the weather control your mood? |
| "Her silence caused my anxiety." | How specifically does her silence cause your anxiety? Has she been silent without you feeling anxious? |

---

### distortion — Mind Reading (`mind-reading`)

Claiming to know another person's internal state — thoughts, feelings, intentions — without observable evidence.

**Signal structure**: "X thinks/feels/knows/hates/wants…"

**Examples**

| Input | Challenge |
|-------|-----------|
| "She thinks I'm stupid." | How do you know what she thinks? What specifically makes you believe that? |
| "My boss hates me." | How do you know your boss hates you? What specific evidence leads you there? |
| "They all know I'm a fraud." | How do you know what they know? |

---

### distortion — Lost Performative (`lost-performative`)

A value judgment where the performer of the judgment is missing — a rule or evaluation presented as objective fact with no attributed source.

**Signal structure**: "It's right/wrong/good/bad/best/worst to…"

**Examples**

| Input | Challenge |
|-------|-----------|
| "It's wrong to be selfish." | Wrong according to whom? Who decided that? |
| "That's the right way to do it." | Right according to whom? By whose standard? |
| "It's bad to show emotions at work." | Bad according to whom? How do you know that's true? |

---

### distortion — Complex Equivalence (`complex-equivalence`)

Two experiences are equated as meaning the same thing — X is taken to mean Y without justification.

**Signal structure**: "X, so Y", "X means Y", "X, which means Y".

**Examples**

| Input | Challenge |
|-------|-----------|
| "He didn't call, so he doesn't care." | How does not calling mean not caring? Have you ever not called someone you do care about? |
| "She's quiet, which means she's angry." | How does being quiet mean being angry? Has she ever been quiet without being angry? |
| "You're late, so you obviously don't respect my time." | How does being late mean disrespect? Have you ever been late for an unrelated reason? |

---

### distortion — Presupposition (`presupposition`)

An unstated assumption embedded in the sentence that must be accepted for the sentence to make sense.

**How to spot it**: ask what must already be true for the statement to be a valid question or assertion.

**Examples**

| Input | Challenge |
|-------|-----------|
| "If she really loved me, she'd know what I need." | What leads you to believe love means knowing needs without being told? |
| "Why are you always so difficult?" | What leads you to presuppose I am always difficult? |
| "When will you stop making the same mistakes?" | What leads you to presuppose I am making repeated mistakes? |

---

## 3. Usage

When analysing text for Meta-Model violations, follow these rules exactly.

### Annotation-first behaviour
1. Identify each violation span in the text before generating any challenge question.
2. Extract the **exact substring** from the input — character-for-character. Do not paraphrase, expand, or shorten the span.
3. Sort annotations by order of appearance in the input.
4. Make challenge questions **specific to the actual text** — do not use generic templates verbatim.

### Category / type coherence
- Every `violationType` maps to exactly one `category` (see section 1).
- Never assign `modal-operator-necessity`, `modal-operator-possibility`, or `nominalization` to category `distortion`.
- Never assign `cause-effect`, `mind-reading`, `lost-performative`, `complex-equivalence`, or `presupposition` to category `deletion` or `generalization`.

### Empty-array rule
If the text contains no Meta-Model violations — specific, well-referenced, and free of hidden assumptions — return an **empty annotations array**. Well-formed, factual, specific statements are NOT violations.

Clean examples (no violations):
- "I went to the grocery store at 3pm and bought apples, bread, and milk."
- "Sarah called me yesterday to discuss the project. She suggested we move the deadline to Friday."
- "I feel anxious about the presentation tomorrow because I have not finished the slides yet."

### No invented types
The 13 violation types listed above are canonical (mirrored from `ViolationType` in `src/types/analysis.ts`). Do not invent new types or sub-types.

---

## 4. Optional JSON schema

When structured output is needed (e.g. building a downstream annotator), validate against this schema:

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

---

## 5. Mixed-passage worked example

Input: `"Nobody understands me. I should always put others first. My mother makes me feel guilty. It's wrong to ask for help. Our communication is broken."`

Expected annotations:

| Span | violationType | category |
|------|---------------|----------|
| `Nobody` | `universal-quantifier` | `generalization` |
| `should always` | `modal-operator-necessity` | `generalization` |
| `mother makes me feel guilty` | `cause-effect` | `distortion` |
| `wrong to ask for help` | `lost-performative` | `distortion` |
| `communication` | `nominalization` | `generalization` |

This exercise illustrates that a single passage can legitimately mix deletions, generalisations, and distortions — and that each span is annotated with its own canonical type, regardless of neighbouring spans.
