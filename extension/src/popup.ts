const STORAGE_KEY = 'mma_extension_settings'

interface Settings {
  ollamaUrl: string
  modelName: string
}

const urlInput = document.getElementById('ollama-url') as HTMLInputElement
const modelInput = document.getElementById('model-name') as HTMLInputElement
const analyzeBtn = document.getElementById('btn-analyze') as HTMLButtonElement
const checkBtn = document.getElementById('btn-check') as HTMLButtonElement
const statusDot = document.getElementById('status-dot') as HTMLElement
const statusText = document.getElementById('status-text') as HTMLElement

// Load settings
chrome.storage.local.get(STORAGE_KEY, (data: Record<string, Settings | undefined>) => {
  const settings = data[STORAGE_KEY] || { ollamaUrl: 'http://localhost:11434', modelName: 'llama3.1:8b' }
  urlInput.value = settings.ollamaUrl
  modelInput.value = settings.modelName
  updateAnalyzeButton()
})

// Save settings on change
urlInput.addEventListener('input', saveSettings)
modelInput.addEventListener('input', saveSettings)

function saveSettings() {
  chrome.storage.local.set({
    [STORAGE_KEY]: {
      ollamaUrl: urlInput.value,
      modelName: modelInput.value,
    },
  })
  updateAnalyzeButton()
}

function updateAnalyzeButton() {
  analyzeBtn.disabled = !urlInput.value.trim() || !modelInput.value.trim()
}

// Check Ollama connection
checkBtn.addEventListener('click', async () => {
  const url = urlInput.value.replace(/\/+$/, '')
  checkBtn.disabled = true
  checkBtn.textContent = 'Checking…'
  setStatus('checking')

  try {
    const response = await fetch(`${url}/api/tags`)
    if (response.ok) {
      const data = await response.json()
      const models = data.models?.map((m: { name: string }) => m.name) || []
      setStatus('connected', `Connected! ${models.length} model(s) available.`)
    } else {
      setStatus('error', `HTTP ${response.status} — Is Ollama running?`)
    }
  } catch {
    setStatus('error', 'Cannot reach Ollama. Check URL and that it is running.')
  } finally {
    checkBtn.disabled = false
    checkBtn.textContent = 'Check Ollama Connection'
  }
})

// Analyze selected text
analyzeBtn.addEventListener('click', async () => {
  const settings: Settings = {
    ollamaUrl: urlInput.value.replace(/\/+$/, ''),
    modelName: modelInput.value,
  }

  // First, get the selected text from the active tab
  const result = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = result[0]
  if (!tab?.id) {
    alert('No active tab found')
    return
  }

  // Get selected text from content script
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'get_selected_text' })
    const text = response?.text || ''

    if (!text.trim()) {
      alert('No text selected. Please select some text on the page first.')
      return
    }

    if (text.trim().length < 10) {
      alert('Selection too short. Select a longer passage for better analysis.')
      return
    }

    analyzeBtn.disabled = true
    analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing…'
    setStatus('checking', 'Analyzing…')

    // Send to background for analysis
    await chrome.runtime.sendMessage({
      type: 'analyze_text',
      payload: {
        text: text.trim(),
        modelName: settings.modelName,
        ollamaUrl: settings.ollamaUrl,
      },
    })

    // The content script will receive the result and show the overlay
    setStatus('connected', 'Done! Check the overlay.')
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to analyze'
    setStatus('error', msg)
  } finally {
    analyzeBtn.disabled = false
    analyzeBtn.textContent = 'Analyze Selection'
  }
})

function setStatus(state: 'idle' | 'checking' | 'connected' | 'error', text?: string) {
  statusDot.className = 'status-dot'
  if (state === 'checking') {
    statusText.textContent = 'Checking…'
  } else if (state === 'connected') {
    statusDot.classList.add('connected')
    statusText.textContent = text || 'Connected'
  } else if (state === 'error') {
    statusDot.classList.add('error')
    statusText.textContent = text || 'Error'
  } else {
    statusText.textContent = text || 'Not checked'
  }
}
