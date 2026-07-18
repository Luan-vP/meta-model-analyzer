# Android Keyboard Technical Design

## Overview

An Android custom keyboard (`InputMethodService`) that analyzes user typing in
real-time using an on-device LLM server (Ollama, LM Studio, etc.) via the
OpenAI-compatible `/v1/chat/completions` protocol. Meta-Model violations are
displayed as red-underlined "spelling errors" with clickable challenge questions
as correction suggestions.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  MetaModelInputService (InputMethodService)      │
│  ┌──────────────┐  ┌──────────────────────┐     │
│  │  Keyboard     │  │  CandidateView       │     │
│  │  (QWERTY     │  │  (spelling chips,    │     │
│  │   XML layout)│  │   challenge Qs)      │     │
│  └──────┬───────┘  └──────────┬───────────┘     │
│         │                     │                  │
│  ┌──────▼─────────────────────▼───────────┐     │
│  │  KeyboardViewModel (StateHolder)       │     │
│  │  - current text buffer                 │     │
│  │  - active annotations                  │     │
│  │  - debounced analysis trigger          │     │
│  └──────┬────────────────────────────────┘     │
│         │                                      │
│  ┌──────▼────────────────────────────────┐     │
│  │  MetaModelAnalyzer                    │     │
│  │  - build prompt → HTTP → parse JSON   │     │
│  │  - validate annotations               │     │
│  │  - resolve character offsets          │     │
│  └──────┬────────────────────────────────┘     │
│         │                                      │
│  ┌──────▼────────────────────────────────┐     │
│  │  OpenAiHttpClient                     │     │
│  │  - OkHttp client                     │     │
│  │  - /v1/chat/completions              │     │
│  │  - SSE streaming (future)            │     │
│  └──────┬────────────────────────────────┘     │
│         │                                      │
└─────────┼──────────────────────────────────────┘
          │ HTTP (localhost:11434)
          ▼
   ┌──────────────┐
   │ On-device    │
   │ LLM Server   │  (Ollama, LM Studio, etc.)
   └──────────────┘
```

## Modules

```
android-keyboard/
  build.gradle.kts                       # module config
  src/main/
    AndroidManifest.xml                  # IME service declaration
    kotlin/com/luanvp/metamodel/keyboard/
      KeyboardApplication.kt             # App lifecycle, DI setup
      MetaModelInputService.kt           # InputMethodService entry point
      ui/
        MetaModelKeyboardView.kt         # Custom keyboard view
        CandidateView.kt                 # Spelling suggestion bar
        layout/
          keyboard_main.xml              # Keyboard + candidate view layout
          candidate_bar.xml              # Suggestion chip layout
          keyboard_keys.xml              # QWERTY key definitions
      analysis/
        MetaModelAnalyzer.kt             # Prompt building, JSON parsing, offset resolution
        Annotation.kt                    # Data class mirroring core/domain/annotation.ts
        ViolationType.kt                 # Sealed class / enum for violation types
        PromptBuilder.kt                 # SYSTEM_PROMPT + user message formatting
      network/
        OpenAiHttpClient.kt              # OkHttp-based client
        OpenAiProtocol.kt               # Data classes mirroring keyboard/protocol/openai.ts
      settings/
        KeyboardSettings.kt              # Server URL, model, preferences
        SettingsActivity.kt              # Settings UI
    res/
      values/strings.xml
      values/styles.xml
      drawable/                          # Key backgrounds, underline icons
```

## Key Design Decisions

### 1. On-device server communication

The keyboard connects to an existing LLM server via HTTP. Default target:
`http://localhost:11434/v1` (Ollama's OpenAI-compatible endpoint).

- Uses **OkHttp** for HTTP (connection pooling, timeout, cancellation).
- The `OpenAiProtocol.kt` data classes mirror `keyboard/protocol/openai.ts`.
- Server URL and model name are user-configurable via Settings.

### 2. Analysis pipeline

Mirrors `core/application/analyze-text.ts`:

1. **Debounce**: On text change, wait 800ms of inactivity before triggering analysis.
2. **Prompt**: Build system + user message (from `PromptBuilder.kt`, mirroring `prompt.ts`).
3. **HTTP POST**: Send to `/v1/chat/completions` with `format: "json"`.
4. **Parse JSON**: Extract `annotations` array from LLM response.
5. **Validate**: Filter to valid `violationType` / `category` enum values.
6. **Resolve offsets**: Find each annotation's `text` substring in the original text.
7. **Apply**: Update `CandidateView` with spelling chips.

### 3. Spelling error display

Two complementary mechanisms:

#### A. Inline underlines (via `InputConnection`)

When the keyboard commits text, it uses `InputConnection.commitText()` with
`SpannableString` containing `UnderlineSpan` + `TextColorSpan.RED` on violated
substrings. The host app's EditText renders these as red underlines.

```kotlin
val spannable = SpannableString(fullText)
for (annotation in annotations) {
    spannable.setSpan(
        CompoundUnderlineSpan(Color.RED),
        annotation.startOffset,
        annotation.endOffset,
        Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
    )
}
inputConnection.commitText(spannable, 1)
```

**Limitation**: This only works when the keyboard *commits* text (Enter, next
field). During active typing, the text lives in the host app's EditText and the
keyboard cannot inject spans into it.

#### B. Candidate suggestion bar (primary mechanism)

A `CandidateView` above the keyboard shows violation phrases as red-underlined
chips. Tapping a chip shows the challenge question in a tooltip/popover and
optionally replaces the text with the clarified version.

```
┌──────────────────────────────────────────┐
│  ~everyone knows~   ~can't~   ~makes~    │  ← clickable chips
│  [Everyone? Who?] [What prevents?] [How?] │  ← challenge Qs
├──────────────────────────────────────────┤
│  Q W E R T Y ...                        │  ← standard keyboard
└──────────────────────────────────────────┘
```

### 4. Debouncing and incremental analysis

- **Debounce interval**: 800ms (configurable).
- **Max text window**: Last 500 characters (to keep token usage reasonable).
- **Cancellation**: Previous analysis request is cancelled via `CoroutineScope.cancel()`
  when new text arrives.
- **Cache**: Results are cached per text hash to avoid redundant LLM calls.

### 5. Threading

- Analysis runs on `Dispatchers.IO` (network-bound).
- UI updates on `Dispatchers.Main` (via ViewModel LiveData/StateFlow).
- HTTP timeout: 30 seconds (shorter than desktop default since user expects fast feedback).

### 6. Permissions and Manifest

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<service
    android:name=".MetaModelInputService"
    android:permission="android.permission.BIND_INPUT_METHOD"
    android:exported="true">
    <intent-filter>
        <action android:name="android.view.InputMethod" />
    </intent-filter>
    <meta-data
        android:name="android.view.im"
        android:resource="@xml/method" />
</service>
```

### 7. Keyboard definition (`res/xml/method.xml`)

```xml
<input-method xmlns:android="http://schemas.android.com/apk/res/android">
    <subtype
        android:label="@string/keyboard_label"
        android:imeSubtypeMode="keyboard"
        android:imeSubtypeLanguageOverride="en" />
</input-method>
```

## Data Flow

```
User types "Everyone knows I can't do anything right"
         │
         ▼ (onKeyDown / onUpdateExtractedText)
   KeyboardViewModel.textBuffer ← updated
         │
         ▼ (debounce 800ms)
   MetaModelAnalyzer.analyze("Everyone knows I can't...")
         │
         ▼ (HTTP POST to localhost:11434/v1/chat/completions)
   LLM → {"annotations":[{"text":"Everyone knows",
         "violationType":"universal-quantifier",...}, ...]}
         │
         ▼ (validate + resolveOffsets)
   [Annotation(start=0, end=12, text="Everyone knows",
               question="Everyone? Is there anyone who doesn't?")]
         │
         ▼ (StateFlow emission)
   CandidateView.render(annotations)
         │
         ▼ (UI update)
   Red-underlined chips appear above keyboard
```

## Relationship to shared `keyboard/` package

| `keyboard/` (TypeScript) | Android (Kotlin) | Purpose |
|---|---|---|
| `protocol/openai.ts` | `network/OpenAiProtocol.kt` | Request/response data shapes |
| `client/http-client.ts` | `network/OpenAiHttpClient.kt` | HTTP transport layer |
| `providers/openai-compatible.ts` | N/A (Android uses analyzer directly) | LlmProvider adapter (TS-only) |
| `core/domain/annotation.ts` | `analysis/Annotation.kt` | Domain model |
| `core/application/prompt.ts` | `analysis/PromptBuilder.kt` | Prompt construction |
| `core/application/analyze-text.ts` | `analysis/MetaModelAnalyzer.kt` | Analysis pipeline |

The Kotlin code mirrors the TypeScript architecture but is a native
implementation — not a transpilation. The TypeScript `keyboard/` package serves
as the **reference implementation** and **protocol specification**.
