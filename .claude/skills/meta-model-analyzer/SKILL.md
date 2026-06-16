---
name: meta-model-analyzer
description: Analyze text for NLP Meta-Model violations (from Bandler & Grinder's "The Structure of Magic") and render the result as a self-contained HTML file — the original text with wavy colored underlines per violation category and hover/focus tooltips showing each violation type and its challenge question. Use when the user asks to analyze, annotate, or check text for Meta-Model violations, deletions, generalizations, distortions, mind-reading, nominalizations, modal operators, universal quantifiers, cause-effect, presuppositions, or to surface "challenge questions" / clean-language questions for a passage.
---

# Meta-Model Analyzer

Analyze a passage of text for **NLP Meta-Model violations** and produce a rendered HTML view: the
original text with each violation wavy-underlined in its category color, and a tooltip (on hover or
keyboard focus) showing the violation type and a specific challenge question.

This is the conversational counterpart to the Meta-Model Analyzer web app — same catalogue, same
colors, same tooltip layout, but it runs here and writes a standalone `.html` file you can open in a
browser.

## When to use

Trigger on requests like: "analyze this for meta-model violations", "where are the deletions /
distortions / generalizations in this", "annotate this transcript with challenge questions", "what
clean-language questions would you ask about this paragraph".

## Workflow

1. **Get the text.** Use what the user provided. If they pointed at a file, read it. If no text is
   present, ask for it.
2. **Identify violations** using the catalogue below. Each flagged phrase needs: the exact substring,
   the violation type, its category, and a specific challenge question grounded in the actual words.
3. **Render** by copying `template.html` (in this skill's directory) and replacing its four
   placeholders. Write the result to an `.html` file (default: `meta-model-analysis.html` in the
   current working directory; pick a clearer name if the context suggests one).
4. **Report** the file path and a one-line summary (counts per category). Offer to open it
   (`open <file>` on macOS). Don't auto-open unless asked.

## The Meta-Model catalogue

Three categories. **Each violation type belongs to exactly one category — never reassign it.**

### deletion — information is missing  (underline `#E05252`, badge bg `#FEE2E2`, badge text `#991B1B`)
- **simple-deletion** — *Simple Deletion*: important info left out. e.g. "I'm scared" → "Scared of what specifically?"
- **comparative-deletion** — *Comparative Deletion*: a comparison with no standard. e.g. "She's better" → "Better than whom?"
- **lack-of-referential-index** — *Lack of Referential Index*: a nonspecific noun phrase. e.g. "They don't care" → "Who specifically doesn't care?"
- **unspecified-verb** — *Unspecified Verb*: verb doesn't say how. e.g. "He hurt me" → "How specifically did he hurt you?"

### generalization — overgeneralized patterns  (underline `#0D9488`, badge bg `#CCFBF1`, badge text `#115E59`)
- **universal-quantifier** — *Universal Quantifier*: always / never / everyone / nobody / all / every / none. e.g. "Nobody listens" → "Nobody? Has there ever been a time someone listened?"
- **modal-operator-necessity** — *Modal Operator of Necessity*: must / have to / should / need to / ought to. e.g. "I should be strong" → "What would happen if you weren't?"
- **modal-operator-possibility** — *Modal Operator of Possibility*: can't / impossible / unable / couldn't. e.g. "I can't change" → "What prevents you from changing?"
- **nominalization** — *Nominalization*: a process (verb) frozen into a noun. e.g. "our relationship" → "How are you relating to each other?"

### distortion — meaning is twisted  (underline `#6366F1`, badge bg `#E0E7FF`, badge text `#3730A3`)
- **cause-effect** — *Cause-Effect*: X causes/makes Y. e.g. "He makes me angry" → "How does what he does cause you to choose anger?"
- **mind-reading** — *Mind Reading*: claiming to know another's internal state. e.g. "She thinks I'm stupid" → "How do you know what she thinks?"
- **lost-performative** — *Lost Performative*: a value judgment with the judge missing. e.g. "It's wrong to be selfish" → "Wrong according to whom?"
- **complex-equivalence** — *Complex Equivalence*: X equated with Y. e.g. "He didn't call so he doesn't care" → "How does not calling mean not caring?"
- **presupposition** — *Presupposition*: a hidden assumption baked into the sentence. e.g. "Why are you always so difficult?" → "What leads you to presuppose I'm always difficult?"

## Analysis rules

- Substrings must be **exact, character-for-character** matches from the input (so they can be located
  and wrapped). Keep them as short as the violation requires.
- One phrase may carry more than one violation (e.g. "Someone hurt me" = lack-of-referential-index +
  unspecified-verb). When overlapping spans would collide, prefer the longer/most salient span and
  mention the secondary type in its challenge question rather than nesting underlines.
- Sort annotations by order of appearance.
- Make each challenge question **specific to the actual text**, not a generic template.
- Well-formed, specific statements are **not** violations. If the text has none, render the page with
  an empty-state message (see below) — don't invent violations.

## Building the HTML

Copy `template.html` and replace exactly these placeholders:

- `{{TITLE}}` — a short title, e.g. `Meta-Model Analysis`.
- `{{COUNT_SUMMARY}}` — e.g. `5 violations found` (or `0 violations found`).
- `{{LEGEND}}` — one chip per category that actually appears:
  `<span class="item"><span class="dot dot-deletion"></span>deletion (3)</span>` (classes:
  `dot-deletion` / `dot-generalization` / `dot-distortion`).
- `{{BODY}}` — the original text with violations wrapped. **Preserve all original characters and
  whitespace** (the card uses `white-space: pre-wrap`). HTML-escape `&`, `<`, `>` in the text.

Wrap each violation like this (category class on `.v`, matching `badge-*` class on the badge):

```html
<span class="v distortion" tabindex="0">She makes me angry<span class="tip"><span class="head"><span class="badge badge-distortion">distortion</span><span class="name">Cause-Effect</span></span><span class="q">"How specifically does she cause you to feel angry?"</span></span></span>
```

Note: `.name` is the human display name (e.g. *Cause-Effect*), the badge text is the lowercase
category. The challenge question goes in `<span class="q">` wrapped in straight quotes. Keep the whole
violation as nested inline `<span>`s — no block elements (`<p>`, `<div>`) inside `.v`.

If there are no violations, set `{{COUNT_SUMMARY}}` to `0 violations found`, leave `{{LEGEND}}` empty,
and set `{{BODY}}` to `<span class="empty">No Meta-Model violations detected in this text.</span>`.

## Notes

- The HTML is fully self-contained (inline CSS, no JavaScript, no network) — tooltips work via CSS
  `:hover`/`:focus`, so it's portable and openable offline.
- The category→type mapping is fixed (see catalogue). If you're unsure of a type's category, look it
  up here rather than guessing — the app auto-corrects this server-side, but here it's on you.
