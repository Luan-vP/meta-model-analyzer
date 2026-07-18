# Meta-Model Android Keyboard

An Android custom keyboard (InputMethodService) that analyzes typed text for
Meta-Model linguistic violations using an on-device LLM server, and displays
clarifying questions as spelling-error chips above the keyboard.

## Architecture

See [docs/keyboard/android-keyboard.md](../docs/keyboard/android-keyboard.md) for
the full technical design.

## Quick start

1. **Prerequisites**: Android Studio Ladybug+ (Gradle 8.12+), JDK 17+
2. **Open** `android-keyboard/` in Android Studio
3. **Run** on an emulator or device (API 26+)
4. **Enable** the keyboard: Settings → System → Languages → keyboards →
   Meta-Model Keyboard
5. **Configure**: Open the app → set LLM server URL (default `localhost:11434/v1`)
   and model name

## Project structure

```
app/src/main/
  kotlin/com/luanvp/metamodel/keyboard/
    KeyboardApplication.kt       # OkHttp client setup
    MetaModelInputService.kt     # InputMethodService entry point
    ui/
      CandidateView.kt           # Spelling-error chip bar
    analysis/
      Annotation.kt              # Domain model (mirrors core/domain)
      ViolationType.kt           # Violation enum (mirrors core/domain)
      PromptBuilder.kt           # System prompt + message formatting
      MetaModelAnalyzer.kt       # Prompt → HTTP → parse → validate → resolve
    network/
      OpenAiProtocol.kt          # Request/response data classes
      OpenAiHttpClient.kt        # OkHttp client for /v1/chat/completions
    settings/
      KeyboardSettings.kt        # SharedPrefs-backed configuration
      SettingsActivity.kt        # Settings screen
  res/
    xml/method.xml               # IME service declaration
    xml/keyboard_qwerty.xml      # QWERTY key layout
    layout/keyboard_main.xml     # Keyboard + candidate bar layout
    layout/candidate_bar.xml     # Chip container layout
```

## How it works

1. User types on the keyboard
2. Each keystroke triggers a debounced analysis (800ms default)
3. The full input text is extracted via `InputConnection.getExtractedText()`
4. `MetaModelAnalyzer` builds the prompt, calls the LLM server, and parses
   the JSON response
5. Validated annotations are resolved to character offsets
6. Violations appear as red-underlined chips in the candidate bar
7. Tapping a chip shows the challenge question as a toast

## Relationship to shared package

| Shared (`keyboard/`) | Android (`app/src/main/kotlin`) | Role |
|---|---|---|
| `protocol/openai.ts` | `network/OpenAiProtocol.kt` | Protocol data shapes |
| `client/http-client.ts` | `network/OpenAiHttpClient.kt` | HTTP transport |
| `domain/annotation.ts` | `analysis/Annotation.kt` | Domain model |
| `application/prompt.ts` | `analysis/PromptBuilder.kt` | Prompt construction |
| `application/analyze-text.ts` | `analysis/MetaModelAnalyzer.kt` | Analysis pipeline |

The Kotlin code is a **native port**, not a transpilation. The TypeScript
`keyboard/` package serves as the reference implementation and protocol spec.
