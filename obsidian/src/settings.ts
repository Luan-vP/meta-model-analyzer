import { App, PluginSettingTab, Setting } from 'obsidian'
import type MetaModelPlugin from './main'

export type ProviderId = 'ollama' | 'claude'

export interface MetaModelSettings {
  provider: ProviderId
  ollamaUrl: string
  ollamaModel: string
  claudeApiKey: string
}

export const DEFAULT_SETTINGS: MetaModelSettings = {
  provider: 'ollama',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.1:8b',
  claudeApiKey: '',
}

export class MetaModelSettingTab extends PluginSettingTab {
  private plugin: MetaModelPlugin

  constructor(app: App, plugin: MetaModelPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    new Setting(containerEl)
      .setName('Provider')
      .setDesc('Which LLM analyzes your text.')
      .addDropdown((d) =>
        d
          .addOption('ollama', 'Local (Ollama)')
          .addOption('claude', 'Claude')
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value as ProviderId
            await this.plugin.saveSettings()
            this.display()
          }),
      )

    if (this.plugin.settings.provider === 'ollama') {
      new Setting(containerEl)
        .setName('Ollama URL')
        .setDesc('Base URL of your local Ollama server.')
        .addText((t) =>
          t
            .setPlaceholder('http://localhost:11434')
            .setValue(this.plugin.settings.ollamaUrl)
            .onChange(async (value) => {
              this.plugin.settings.ollamaUrl = value
              await this.plugin.saveSettings()
            }),
        )

      new Setting(containerEl)
        .setName('Ollama model')
        .setDesc('Model tag to use (must be pulled in Ollama).')
        .addText((t) =>
          t
            .setPlaceholder('llama3.1:8b')
            .setValue(this.plugin.settings.ollamaModel)
            .onChange(async (value) => {
              this.plugin.settings.ollamaModel = value
              await this.plugin.saveSettings()
            }),
        )

      const note = containerEl.createEl('p', { cls: 'mma-settings-note' })
      note.appendText('Obsidian requests come from the ')
      note.createEl('code', { text: 'app://obsidian.md' })
      note.appendText(' origin. If Ollama returns 403, start it with ')
      note.createEl('code', { text: 'OLLAMA_ORIGINS="app://obsidian.md"' })
      note.appendText(' (or "*").')
    } else {
      new Setting(containerEl)
        .setName('Claude API key')
        .setDesc('Stored locally in this vault. Used directly from the app.')
        .addText((t) => {
          t.setPlaceholder('sk-ant-...')
            .setValue(this.plugin.settings.claudeApiKey)
            .onChange(async (value) => {
              this.plugin.settings.claudeApiKey = value
              await this.plugin.saveSettings()
            })
          t.inputEl.type = 'password'
        })
    }
  }
}
