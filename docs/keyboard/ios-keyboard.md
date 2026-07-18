# iOS Keyboard Technical Design

## Overview

An iOS custom keyboard extension (`UIInputView` with `UIInputViewController`)
that analyzes user typing in real-time using an on-device LLM server via the
OpenAI-compatible protocol. Meta-Model violations are displayed as
red-underlined spelling errors using `UITextEffect` / `NSUnderlineStyleTextSegment`
attributed strings, with challenge questions shown as correction suggestions.

## Architecture

```
┌───────────────────────────────────────────────┐
│  Keyboard Extension (AppClip / Extension)      │
│  ┌─────────────────────────────────────────┐  │
│  │  InputViewController                    │  │
│  │  ┌─────────────┐  ┌──────────────────┐  │  │
│  │  │ UIInputView  │  │ SuggestionBar    │  │  │
│  │  │ (custom      │  │ (red-underlined  │  │  │
│  │  │  QWERTY)     │  │  chips + Qs)     │  │  │
│  │  └──────┬──────┘  └────────┬─────────┘  │  │
│  │         │                  │             │  │
│  │  ┌──────▼──────────────────▼────────┐    │  │
│  │  │ AnalysisCoordinator              │    │  │
│  │  │ - debounced text capture         │    │  │
│  │  │ - analysis lifecycle             │    │  │
│  │  │ - result caching                 │    │  │
│  │  └──────┬───────────────────────────┘    │  │
│  │         │                                │  │
│  │  ┌──────▼───────────────────────────┐    │  │
│  │  │ MetaModelAnalyzer                │    │  │
│  │  │ - build prompt → HTTP → parse    │    │  │
│  │  │ - validate + resolve offsets     │    │  │
│  │  └──────┬───────────────────────────┘    │  │
│  │         │                                │  │
│  │  ┌──────▼───────────────────────────┐    │  │
│  │  │ OpenAiHttpClient                 │    │  │
│  │  │ - URLSession-based              │    │  │
│  │  │ - /v1/chat/completions          │    │  │
│  │  └──────┬───────────────────────────┘    │  │
│  └─────────┼─────────────────────────────────┘  │
│            │ HTTP (localhost:11434)             │
│            ▼                                    │
│     ┌──────────────┐                            │
│     │ On-device    │                            │
│     │ LLM Server   │                            │
│     └──────────────┘                            │
└──────────────────────────────────────────────────┘
```

## Modules

```
ios-keyboard/
  MetaModelKeyboard/                       # Xcode project
    KeyboardExtension/
      Info.plist                           # Extension declaration
      InputViewController.swift            # UIInputViewController entry point
      UI/
        CustomKeyboardView.swift           # QWERTY keyboard (UIButtons or UICollectionView)
        SuggestionBarView.swift            # Spelling chip bar above keyboard
        SpellingChipView.swift             # Individual underlined suggestion chip
        Assets.xcassets                    # Key backgrounds, icons
      Analysis/
        MetaModelAnalyzer.swift            # Prompt, parse, validate, resolve
        Annotation.swift                   # Struct mirroring core/domain/annotation.ts
        ViolationType.swift                # Enum mirroring ViolationType
        PromptBuilder.swift                # SYSTEM_PROMPT + message formatting
      Network/
        OpenAiHttpClient.swift             # URLSession-based client
        OpenAiProtocol.swift              # Structs mirroring keyboard/protocol/openai.ts
      Settings/
        KeyboardSettings.swift             # UserDefaults-backed config
      Utilities/
        Debouncer.swift                    # Combine-based debounce operator
        TextWindowExtractor.swift          # Sliding window over UITextField text
    MetaModelKeyboard.xcodeproj/
    MetaModelKeyboard.xcworkspace/
```

## Key Design Decisions

### 1. Extension sandbox and network access

iOS keyboard extensions run in a **sandboxed container** with strict limitations:

- **Network access**: By default, extensions can make network requests.
  `localhost` resolves within the extension's network namespace. If the LLM
  server is running on the device (e.g., via Ollama for Mac's macOS app, or a
  dedicated iOS LLM server app), the keyboard can reach it at
  `http://localhost:11434/v1`.

- **`RequestsOpenAccess`**: Set to `false` initially (doesn't require user to
  grant "Full Access" in Settings). If the LLM server runs on localhost,
  restricted access is sufficient. If the server runs on a different device,
  set `RequestsOpenAccess = true` and require Full Access.

- **`RequiresFullAccess`**: Set to `true` only if network access to non-local
  hosts is needed. For pure localhost communication, `false` is sufficient.

```xml
<!-- KeyboardExtension/Info.plist -->
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.keyboard-service-extension</string>
    <key>NSExtensionPrincipalClass</key>
    <string>$(PRODUCT_MODULE_NAME).InputViewController</string>
</dict>
<key>UIInputViewOwner</key>
<string>$(PRODUCT_MODULE_NAME).InputViewController</string>
<key>RequestsOpenAccess</key>
<true/>
```

### 2. Communication with host app

The keyboard extension cannot directly modify the host app's `UITextField` /
`UITextView`. It communicates via:

- **`textDocumentProxy`**: `UITextDocumentProxy` provides limited access to the
  current text field:
  - `documentContextBeforeInput` — text before cursor (up to ~100 chars)
  - `documentContextAfterInput` — text after cursor (up to ~100 chars)
  - `insertText(_:)` — insert text at cursor
  - `deleteBackward()` — delete character before cursor
  - `hasText` — whether the field has content

- **Limitation**: `documentContextBeforeInput` is truncated to ~100 characters.
  For full-document analysis, we maintain a **local text buffer** that the
  keyboard updates as keys are pressed. This buffer may drift from the actual
  field content if the user switches keyboards or pastes text.

### 3. Spelling error display

#### A. `nextKeyboardView` overlay (primary mechanism)

A `UIView` above the keyboard keys displays violation phrases as red-underlined
chips. This is the keyboard's own view — fully under our control.

```swift
// SuggestionBarView.swift
let chip = SpellingChipView()
chip.text = "Everyone knows"
chip.challengeQuestion = "Everyone? Is there anyone who doesn't know this?"
chip.underlineColor = .systemRed
chip.underlineStyle = .single
chip.onTap = { /* show popover with challenge question */ }
```

#### B. Inserting attributed text (on commit)

When the user taps a suggestion chip, the keyboard can insert the challenge
question or a clarified version of the text using `textDocumentProxy.insertText()`.
Note: `insertText` only accepts plain `String`, not `NSAttributedString`.
Attributed styling is lost.

**Workaround**: Use a custom `UIInputView` with a `UITextView` preview that
shows the styled text, then copy-to-clipboard or tap-to-insert.

#### C. `UITextAutocorrectionType` integration

The system's native spell checker uses `UITextAutocorrectionType`. We cannot
inject custom "spelling errors" into the system's red-squiggle pipeline. Our
suggestion bar is the primary visual feedback mechanism.

### 4. Text buffering strategy

Since `documentContextBeforeInput` is limited, the keyboard maintains its own
text buffer:

```swift
class TextBuffer {
    private var text: String = ""

    func applyKey(_ key: KeyEvent) {
        switch key {
        case .character(let c):
            text.insert(c, at: cursorPosition)
            cursorPosition += 1
        case .backspace:
            guard cursorPosition > 0 else { return }
            cursorPosition -= 1
            text.remove(at: text.index(text.startIndex, offsetBy: cursorPosition))
        case .space:
            text.insert(" ", at: cursorPosition)
            cursorPosition += 1
        case .return:
            text.insert("\n", at: cursorPosition)
            cursorPosition += 1
        }
    }

    func windowAroundCursor(radius: Int = 250) -> String {
        let start = max(0, cursorPosition - radius)
        let end = min(text.count, cursorPosition + radius)
        return String(text[text.index(text.startIndex, offsetBy: start)...
                           text.index(text.startIndex, offsetBy: end - 1)])
    }
}
```

**Synchronization**: On `viewWillAppear`, fetch `documentContextBeforeInput` +
`documentContextAfterInput` to seed the buffer. On keyboard switch/detach,
reset the buffer.

### 5. Debouncing and analysis

- **Debounce**: 800ms using Combine's `.debounce(for:scheduler:)`.
- **Window**: 500 characters around cursor (250 before + 250 after).
- **Caching**: Results cached by text hash (NSHashedSet or NSCache).
- **Cancellation**: `AsyncSequence.cancel()` or `CancellationToken` pattern.

### 6. Threading

- Analysis: `async/await` on `actor` isolation (dedicated `AnalysisActor`).
- UI: Main thread (SwiftUI or UIKit main queue).
- Network: URLSession handles its own threading.

### 7. Custom keyboard layout

Two approaches:

**A. UIKit (recommended for performance)**:
- `UICollectionView` with custom `UICollectionViewLayout` for key grid.
- `UIButton` cells with custom styling.
- `UIPanGestureRecognizer` for swipe typing (future).

**B. SwiftUI (simpler, acceptable for v1)**:
- `LazyVGrid` for key rows.
- `Button` cells with `onTapGesture`.
- Wrapped in `UIViewRepresentable` for `UIInputView` integration.

### 8. Info.plist configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.keyboard-service-extension</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).InputViewController</string>
        <key>UIInputViewOwner</key>
        <string>$(PRODUCT_MODULE_NAME).InputViewController</string>
    </dict>
    <key>RequestsOpenAccess</key>
    <true/>
</dict>
</plist>
```

## Data Flow

```
User types "Everyone knows I can't do anything right"
         │
         ▼ (InputViewController.textInput(_:) → TextBuffer)
   TextBuffer.applyKey(.character("t"))
         │
         ▼ (Combine debounce 800ms)
   AnalysisCoordinator.analyze(window: "Everyone knows I can't do anything right")
         │
         ▼ (URLSession POST to localhost:11434/v1/chat/completions)
   LLM → {"annotations":[{"text":"Everyone knows",
         "violationType":"universal-quantifier",...}, ...]}
         │
         ▼ (validate + resolveOffsets)
   [Annotation(start: 0, end: 12, text: "Everyone knows",
               question: "Everyone? Is there anyone who doesn't?")]
         │
         ▼ (main actor dispatch)
   SuggestionBarView.update(annotations:)
         │
         ▼ (UIView layout pass)
   Red-underlined chips appear above keyboard
```

## Relationship to shared `keyboard/` package

| `keyboard/` (TypeScript) | iOS (Swift) | Purpose |
|---|---|---|
| `protocol/openai.ts` | `Network/OpenAiProtocol.swift` | Request/response data shapes |
| `client/http-client.ts` | `Network/OpenAiHttpClient.swift` | HTTP transport layer |
| `providers/openai-compatible.ts` | N/A (iOS uses analyzer directly) | LlmProvider adapter (TS-only) |
| `core/domain/annotation.ts` | `Analysis/Annotation.swift` | Domain model |
| `core/application/prompt.ts` | `Analysis/PromptBuilder.swift` | Prompt construction |
| `core/application/analyze-text.ts` | `Analysis/MetaModelAnalyzer.swift` | Analysis pipeline |

The Swift code mirrors the TypeScript architecture but is a native
implementation. The TypeScript `keyboard/` package serves as the **reference
implementation** and **protocol specification**.

## Platform-specific challenges

1. **Extension sandbox**: No file system access, limited UserDefaults sharing
   (use `appGroup` container for settings shared with host app).
2. **No direct text styling**: Cannot inject attributed strings into host app's
   text field. Suggestion bar is the primary feedback mechanism.
3. **Background execution**: Extension is suspended when not visible. Analysis
   must complete while the keyboard is active.
4. **Memory constraints**: Extension shares memory budget with the host app.
   Keep text buffer and annotation cache bounded.
5. **Testing**: Extensions cannot be unit-tested in isolation. Use a host app
   target for integration testing.
