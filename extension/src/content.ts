// NOTE: Content scripts are loaded as *classic* scripts — they cannot be ES
// modules and must not contain `import`/`export` statements (Chrome rejects the
// whole file with "Unexpected token 'export'"). We therefore reference shared
// types via inline `import(...)` type aliases, which are erased by tsc and keep
// this file a classic script (no `export {}` is appended to the output).
type AnalysisResult = import('./types').AnalysisResult
type ExtensionMessage = import('./types').ExtensionMessage

// Resolve a packaged paper texture (shared with the web app) to a URL usable
// from the host page. Only valid at runtime, so callers must build style
// strings lazily rather than at module-eval time.
const texUrl = (name: string): string => chrome.runtime.getURL(`textures/${name}`)

// --- State (scoped to init closure) ---

let overlayPanel: OverlayPanel | null = null
let isAnalyzing = false
let bannerEl: HTMLElement | null = null

// --- Init (runs inside DOMContentLoaded for guaranteed DOM) ---
// IMPORTANT: the actual init trigger lives at the *bottom* of this file. Content
// scripts run at document_idle (DOM already parsed), so the trigger fires
// immediately — it must run after every class/const below has been declared,
// otherwise we hit a temporal-dead-zone error (e.g. accessing OverlayPanel or
// CSS_TEXT before initialization).

function init() {
  if (!document.body) {
    console.warn('[MMA] document.body not available, retrying…')
    setTimeout(init, 100)
    return
  }

  try {
    createOverlayPanel()
    setupMessageListener()
    setupSelectionHandler()
    injectStyles()
    console.log('[MMA] Content script loaded')
  } catch (e) {
    console.error('[MMA] Init failed:', e)
  }
}

// --- Styles ---

// Built lazily (not at module eval) so texUrl() can resolve packaged textures.
// Warm "paper" palette + handmade-paper surface, mirroring the web app.
function buildCssText(): string {
  const surface = texUrl('handmade-paper.png')
  return `
  #mma-banner-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #ede3cf;
    background-image: url('${surface}');
    border: 1px solid #d6c7b1;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(60, 43, 20, 0.14);
  }
  #mma-banner-text {
    font-size: 12px;
    color: #5e5246;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  #mma-banner-btn {
    font-size: 12px;
    padding: 4px 10px;
    background: #c0763b;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
  }
  #mma-banner-btn:hover {
    background: #a05e2a;
  }
  #mma-banner-close {
    font-size: 11px;
    padding: 4px 6px;
    background: none;
    border: none;
    color: #7a6b5c;
    cursor: pointer;
  }
  .mma-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #d6c7b1;
  }
  .mma-panel-title {
    font-size: 14px;
    font-weight: 600;
    color: #2b2215;
  }
  .mma-panel-close {
    font-size: 14px;
    background: none;
    border: none;
    color: #7a6b5c;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .mma-panel-close:hover {
    background: #d6c7b1;
    color: #3d3228;
  }
`
}

function injectStyles() {
  if (document.getElementById('mma-extension-styles')) return
  const style = document.createElement('style')
  style.id = 'mma-extension-styles'
  style.textContent = buildCssText()
  document.head.appendChild(style)
}

// --- Overlay Panel ---

class OverlayPanel {
  private container: HTMLDivElement

  constructor() {
    this.container = document.createElement('div')
    this.container.id = 'mma-overlay-panel'
    this.container.style.cssText = `
      position: fixed;
      bottom: 60px;
      right: 20px;
      width: 380px;
      max-height: 500px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(60, 43, 20, 0.18), 0 2px 8px rgba(60, 43, 20, 0.10);
      background-color: #ede3cf;
      background-image: url('${texUrl('handmade-paper.png')}');
      border: 1px solid #d6c7b1;
      overflow: hidden;
      transition: opacity 0.2s, transform 0.2s;
      transform-origin: bottom right;
      display: none;
    `
    document.body.appendChild(this.container)
  }

  showAnalyzing() {
    this.container.innerHTML = `
      <div class="mma-panel-header">
        <span class="mma-panel-title">Meta-Model Analyzer</span>
        <button class="mma-panel-close">✕</button>
      </div>
      <div style="padding: 24px; text-align: center;">
        <div style="display: inline-block; width: 24px; height: 24px; border: 3px solid #d6c7b1; border-top-color: #c0763b; border-radius: 50%; animation: mma-spin 0.8s linear infinite;"></div>
        <p style="margin: 12px 0 0; color: #5e5246; font-size: 13px;">Analyzing with Ollama…</p>
      </div>
    `
    this.container.style.display = 'block'
    this.container.style.opacity = '1'
    this.container.style.transform = 'scale(1)'
    this.attachCloseHandler()

    // Ensure animation keyframes exist
    if (!document.getElementById('mma-panel-anim-style')) {
      const s = document.createElement('style')
      s.id = 'mma-panel-anim-style'
      s.textContent = `@keyframes mma-spin { to { transform: rotate(360deg); } }`
      document.head.appendChild(s)
    }
  }

  showResult(result: AnalysisResult) {
    const { originalText, annotations } = result

    if (annotations.length === 0) {
      this.container.innerHTML = `
        <div class="mma-panel-header">
          <span class="mma-panel-title">Meta-Model Analyzer</span>
          <button class="mma-panel-close">✕</button>
        </div>
        <div style="padding: 24px;">
          <p style="color: #5e5246; font-size: 13px; line-height: 1.5;">No Meta-Model violations detected in this text.</p>
        </div>
      `
      this.container.style.display = 'block'
      this.container.style.opacity = '1'
      this.container.style.transform = 'scale(1)'
      this.attachCloseHandler()
      return
    }

    const counts: Record<string, number> = {}
    for (const a of annotations) {
      counts[a.category] = (counts[a.category] || 0) + 1
    }

    const categoryColors: Record<string, { underline: string; badgeBg: string; badgeText: string }> = {
      deletion: { underline: '#C026D3', badgeBg: '#FAE8FF', badgeText: '#86198F' },
      generalization: { underline: '#0D9488', badgeBg: '#CCFBF1', badgeText: '#115E59' },
      distortion: { underline: '#6366F1', badgeBg: '#E0E7FF', badgeText: '#3730A3' },
    }

    const legendHtml = Object.entries(counts)
      .map(([category, count]) => {
        const colors = categoryColors[category]
        return `<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #5e5246;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${colors.underline};"></span>
          <span style="text-transform: capitalize;">${category}</span> (${count})
        </span>`
      })
      .join('')

    const annotationsHtml = annotations
      .map((a) => {
        const colors = categoryColors[a.category]
        return `<div style="margin-bottom: 12px; padding: 10px; border-radius: 8px; border: 1px solid #d6c7b1; background: #f3efe0;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${colors.badgeBg}; color: ${colors.badgeText}; text-transform: uppercase;">
              ${a.category}
            </span>
            <span style="font-size: 11px; color: #7a6b5c; text-transform: capitalize;">${a.violationType.replace(/-/g, ' ')}</span>
          </div>
          <p style="font-size: 13px; font-weight: 500; color: #2b2215; margin: 4px 0; text-decoration: underline; text-decoration-color: ${colors.underline}; text-decoration-style: wavy; text-decoration-thickness: 2px; text-underline-offset: 3px;">
            "${escapeHtml(a.text)}"
          </p>
          <p style="font-size: 12px; color: #2b2215; margin: 4px 0 0;">
            "${escapeHtml(a.challengeQuestion)}"
          </p>
        </div>`
      })
      .join('')

    this.container.innerHTML = `
      <div class="mma-panel-header">
        <span class="mma-panel-title">Meta-Model Analyzer</span>
        <button class="mma-panel-close">✕</button>
      </div>
      <div style="padding: 12px 16px; border-bottom: 1px solid #d6c7b1;">
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px;">
          ${legendHtml}
        </div>
      </div>
      <div style="padding: 12px 16px; max-height: 400px; overflow-y: auto;">
        <div style="font-size: 12px; color: #7a6b5c; margin-bottom: 8px; padding: 6px 8px; background-color: #ede3cf; background-image: url('${texUrl('notebook.png')}'); border: 1px solid #d6c7b1; border-radius: 6px;">
          Analyzed: "${escapeHtml(originalText.slice(0, 100))}${originalText.length > 100 ? '…' : ''}"
        </div>
        ${annotationsHtml}
      </div>
    `

    this.container.style.display = 'block'
    this.container.style.opacity = '1'
    this.container.style.transform = 'scale(1)'
    this.attachCloseHandler()
  }

  showError(message: string) {
    this.container.innerHTML = `
      <div class="mma-panel-header">
        <span class="mma-panel-title">Meta-Model Analyzer</span>
        <button class="mma-panel-close">✕</button>
      </div>
      <div style="padding: 24px;">
        <p style="color: #dc2626; font-size: 13px; line-height: 1.5;">${escapeHtml(message)}</p>
      </div>
    `
    this.container.style.display = 'block'
    this.container.style.opacity = '1'
    this.container.style.transform = 'scale(1)'
    this.attachCloseHandler()
  }

  hide() {
    this.container.style.opacity = '0'
    this.container.style.transform = 'scale(0.95)'
    setTimeout(() => {
      this.container.style.display = 'none'
    }, 200)
  }

  private attachCloseHandler() {
    const closeBtn = this.container.querySelector('.mma-panel-close')
    closeBtn?.addEventListener('click', () => this.hide())
  }
}

function createOverlayPanel() {
  overlayPanel = new OverlayPanel()
}

// --- Message Listener ---

function setupMessageListener() {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      switch (message.type) {
        case 'get_selected_text': {
          const text = getSelectedText()
          sendResponse({ text })
          break
        }
        case 'analysis_ready': {
          const result = message.payload as AnalysisResult
          showOverlay(result)
          sendResponse({ success: true })
          break
        }
        case 'analysis_error': {
          showError(message.payload as { message: string })
          sendResponse({ success: false })
          break
        }
        case 'hide_overlay': {
          hideOverlay()
          sendResponse({ success: true })
          break
        }
        case 'trigger_analysis': {
          handleAnalyzeSelection()
          sendResponse({ success: true })
          break
        }
      }
      // Return false: we call sendResponse synchronously above
      return false
    },
  )
}

// --- Selection Banner ---

function setupSelectionHandler() {
  document.addEventListener('mouseup', () => {
    try {
      const text = getSelectedText()
      if (text.trim().length > 0) {
        showAnalyzeBanner(text)
      } else {
        hideAnalyzeBanner()
      }
    } catch (e) {
      console.warn('[MMA] Selection handler error:', e)
    }
  })
}

function getSelectedText(): string {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return ''
  return selection.toString()
}

function showAnalyzeBanner(text: string) {
  if (!bannerEl) {
    bannerEl = document.createElement('div')
    bannerEl.id = 'mma-analyze-banner'
    bannerEl.innerHTML = `
      <div id="mma-banner-inner">
        <span id="mma-banner-text">Selected text</span>
        <button id="mma-banner-btn" title="Analyze with Meta-Model">🔍 Analyze</button>
        <button id="mma-banner-close" title="Dismiss">✕</button>
      </div>
    `
    bannerEl.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: opacity 0.2s, transform 0.2s;
      transform: translateY(0);
      opacity: 1;
    `
    document.body.appendChild(bannerEl)

    bannerEl.querySelector('#mma-banner-btn')?.addEventListener('click', async () => {
      const selText = getSelectedText()
      if (selText.trim()) {
        const settings = await getSettings()
        analyzeText(selText.trim(), settings)
        hideAnalyzeBanner()
      }
    })

    bannerEl.querySelector('#mma-banner-close')?.addEventListener('click', hideAnalyzeBanner)
  }

  const textEl = document.getElementById('mma-banner-text')
  if (textEl) {
    const display = text.trim().length > 60 ? text.trim().slice(0, 60) + '…' : text.trim()
    textEl.textContent = `"${display}"`
  }
  bannerEl.style.opacity = '1'
  bannerEl.style.transform = 'translateY(0)'
}

function hideAnalyzeBanner() {
  if (bannerEl) {
    bannerEl.style.opacity = '0'
    bannerEl.style.transform = 'translateY(10px)'
  }
}

// --- Analysis ---

async function handleAnalyzeSelection() {
  const text = getSelectedText()
  if (!text.trim()) return
  const settings = await getSettings()
  analyzeText(text.trim(), settings)
}

async function analyzeText(text: string, settings: { ollamaUrl: string; modelName: string }) {
  if (isAnalyzing) return
  isAnalyzing = true

  showAnalyzing()

  try {
    await chrome.runtime.sendMessage({
      type: 'analyze_text',
      payload: { text, modelName: settings.modelName, ollamaUrl: settings.ollamaUrl },
    })
  } catch (error) {
    console.error('[MMA] Analysis failed:', error)
    showError({ message: error instanceof Error ? error.message : 'Failed to analyze' })
  } finally {
    isAnalyzing = false
  }
}

function showAnalyzing() {
  if (overlayPanel) overlayPanel.showAnalyzing()
}

function showOverlay(result: AnalysisResult) {
  if (overlayPanel) overlayPanel.showResult(result)
}

function hideOverlay() {
  if (overlayPanel) overlayPanel.hide()
}

function showError(error: { message: string }) {
  if (overlayPanel) overlayPanel.showError(error.message)
}

// --- Settings ---

function getSettings(): Promise<{ ollamaUrl: string; modelName: string }> {
  return new Promise((resolve) => {
    chrome.storage.local.get('mma_extension_settings', (data) => {
      const s = data['mma_extension_settings']
      resolve({
        ollamaUrl: s?.ollamaUrl || 'http://localhost:11434',
        modelName: s?.modelName || 'llama3.1:8b',
      })
    })
  })
}

// --- Utility ---

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// --- Init trigger (kept last so all declarations above are initialized) ---

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
