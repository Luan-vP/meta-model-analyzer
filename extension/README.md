# Meta-Model Analyzer — Browser Extension (MV3)

Chrome/Edge browser extension that detects Meta-Model linguistic violations in any text on the page, backed by a local Ollama instance.

## Features

- **In-page overlay** — Select any text on any webpage and get a floating analysis panel
- **Context menu banner** — A small "Analyze" button appears near your selection
- **Keyboard shortcut** — Press `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows/Linux) to analyze selected text
- **Local Ollama backend** — All analysis runs locally via your Ollama instance, no data leaves your machine
- **Color-coded violations** — Deletions (red), Generalizations (teal), Distortions (indigo)
- **Challenge questions** — Each violation includes a Meta-Model challenge question

## Prerequisites

1. **Ollama** running locally: https://ollama.ai, **configured to allow the
   extension's origin**. Browser extensions send an `Origin: chrome-extension://…`
   header, which Ollama's default allowlist rejects with `403`. Start Ollama with
   `OLLAMA_ORIGINS` set so it accepts extension requests:
   ```bash
   # Allow browser-extension origins (default port: http://localhost:11434)
   OLLAMA_ORIGINS="chrome-extension://*" ollama serve
   ```
   (On macOS, if Ollama runs as the background app: `launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"`, then restart Ollama.)
2. A model pulled into Ollama (the extension's default is `llama3.1:8b`):
   ```bash
   ollama pull llama3.1:8b  # or any model you prefer
   ```

## Build

```bash
cd extension
npm install
node build.mjs
```

This produces the `dist/` folder ready for loading as an unpacked extension.

## Install

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder

## Usage

### Method 1: Extension Popup
1. Click the extension icon (🧠) in the toolbar
2. Configure Ollama URL and model name
3. Click "Check Ollama Connection" to verify
4. Navigate to any page, select text
5. Click the extension icon again and click "Analyze Selection"

### Method 2: In-page Banner
1. Select any text on a webpage
2. A floating banner appears at the bottom-right with an "Analyze" button
3. Click "Analyze" to run Meta-Model analysis
4. Results appear in a floating overlay panel

### Method 3: Keyboard Shortcut
1. Select text on any page
2. Press `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows/Linux)
3. Results appear in the floating overlay

## Settings

Accessible via the extension popup:

| Setting | Default | Description |
|---------|---------|-------------|
| Ollama URL | `http://localhost:11434` | Where Ollama is running |
| Model | `llama3.1:8b` | Any Ollama model name |

Settings are persisted in `chrome.storage.local`.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Popup     │────▶│  Background  │────▶│   Ollama   │
│  (Settings) │     │  (Service    │     │  (Local)   │
│             │◀────│   Worker)    │◀────│            │
└─────────────┘     └──────────────┘     └────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Content    │
                    │   Script     │
                    │  (Overlay +  │
                    │  Banner)     │
                    └──────────────┘
```

## Violation Categories

### Deletions (Red)
- Simple Deletion
- Comparative Deletion
- Lack of Referential Index
- Unspecified Verb

### Generalizations (Teal)
- Universal Quantifier
- Modal Operator of Necessity
- Modal Operator of Possibility
- Nominalization

### Distortions (Indigo)
- Cause-Effect
- Mind Reading
- Lost Performative
- Complex Equivalence
- Presupposition

## Development

```bash
# Watch mode (recompiles on changes)
npx tsc --watch

# Full rebuild
node build.mjs
```

## Notes

- The extension requires Ollama to be accessible from the browser. Because requests originate from a `chrome-extension://` origin, Ollama must be started with `OLLAMA_ORIGINS="chrome-extension://*"` (see Prerequisites) — otherwise every analysis fails with a `403`. The popup's "Check Ollama Connection" runs from a different origin and may report success even when analysis would be blocked.
- Analysis quality depends on your chosen model. Larger models (7B+) give better results but are slower.
- The extension works on all URLs (`<all_urls>` match pattern).
