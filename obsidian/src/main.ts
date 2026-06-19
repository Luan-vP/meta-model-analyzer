import { Plugin, Notice, MarkdownView, type Editor } from 'obsidian'
import { analyzeText, type LlmProvider } from '@core'
import { OllamaProvider } from '@adapters/providers/ollama'
import { ClaudeProvider } from '@adapters/providers/claude'
import {
  DEFAULT_SETTINGS,
  MetaModelSettingTab,
  type MetaModelSettings,
} from './settings'
import { AnalysisView, VIEW_TYPE_META_MODEL } from './view'

export default class MetaModelPlugin extends Plugin {
  settings: MetaModelSettings = DEFAULT_SETTINGS

  async onload(): Promise<void> {
    await this.loadSettings()

    this.registerView(VIEW_TYPE_META_MODEL, (leaf) => new AnalysisView(leaf))
    this.addSettingTab(new MetaModelSettingTab(this.app, this))

    this.addCommand({
      id: 'analyze-selection',
      name: 'Analyze selection / current note',
      editorCallback: (editor: Editor) => {
        void this.analyze(editor.getSelection() || editor.getValue())
      },
    })

    this.addRibbonIcon('search', 'Meta-Model: analyze note', () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView)
      if (!view) {
        new Notice('Open a note to analyze.')
        return
      }
      void this.analyze(view.editor.getSelection() || view.editor.getValue())
    })
  }

  onunload(): void {}

  private buildProvider(): LlmProvider {
    if (this.settings.provider === 'claude') {
      return new ClaudeProvider(this.settings.claudeApiKey)
    }
    return new OllamaProvider(this.settings.ollamaUrl, this.settings.ollamaModel)
  }

  private async analyze(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) {
      new Notice('Nothing to analyze — select text or open a note.')
      return
    }
    if (this.settings.provider === 'claude' && !this.settings.claudeApiKey) {
      new Notice('Add your Claude API key in Meta-Model Analyzer settings.')
      return
    }

    const view = await this.activateView()
    view.setLoading()
    try {
      const annotations = await analyzeText(this.buildProvider(), trimmed)
      view.setResult({ originalText: trimmed, annotations })
      new Notice(
        `Found ${annotations.length} Meta-Model violation${annotations.length === 1 ? '' : 's'}.`,
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      view.setError(message)
      new Notice('Analysis failed — see the Meta-Model panel.')
    }
  }

  private async activateView(): Promise<AnalysisView> {
    const { workspace } = this.app
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_META_MODEL)[0]
    if (!leaf) {
      const right = workspace.getRightLeaf(false)
      if (!right) throw new Error('Could not open the Meta-Model panel.')
      await right.setViewState({ type: VIEW_TYPE_META_MODEL, active: true })
      leaf = right
    }
    void workspace.revealLeaf(leaf)
    return leaf.view as AnalysisView
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
  }
}
