// The background service worker is bundled (esbuild) into a single module, so
// it consumes the shared hexagon directly: the AnalyzeText use case and the
// Ollama driven adapter.
import { analyzeText, type AnalysisResult } from '@core'
import { OllamaProvider } from '@adapters/providers/ollama'

// Note: request settings (ollamaUrl/modelName) always arrive in the message
// payload from the popup or content script, which own the default values.

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (message.type === 'analyze_text') {
      const payload = message.payload as { text: string; modelName: string; ollamaUrl: string }
      handleAnalyze(payload.text, payload.modelName, payload.ollamaUrl)
        .then((result) => {
          // Send result back to the tab's content script
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'analysis_ready',
                payload: result,
              })
            }
          })
          sendResponse({ success: true })
        })
        .catch((error) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'analysis_error',
                payload: { message: error.message },
              })
            }
          })
          sendResponse({ success: false, error: error.message })
        })
      return true // keep message channel open for async response
    }

    if (message.type === 'get_selected_text') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'get_selected_text' })
            .then((response: { text: string }) => {
              sendResponse(response)
            })
            .catch(() => {
              sendResponse({ text: '' })
            })
        } else {
          sendResponse({ text: '' })
        }
      })
      return true
    }
  },
)

// Handle keyboard shortcut (Ctrl+Shift+M or Cmd+Shift+M)
chrome.commands.onCommand?.addListener((command) => {
  if (command === 'analyze-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'trigger_analysis' })
      }
    })
  }
})

async function handleAnalyze(
  text: string,
  modelName: string,
  ollamaUrl: string,
): Promise<AnalysisResult> {
  const annotations = await analyzeText(new OllamaProvider(ollamaUrl, modelName), text)
  return { originalText: text, annotations }
}
