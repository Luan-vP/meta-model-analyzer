import { ItemView, WorkspaceLeaf } from 'obsidian'
import type { AnalysisResult, ViolationCategory } from '@core'

export const VIEW_TYPE_META_MODEL = 'meta-model-analysis'

const CATEGORY_CLASS: Record<ViolationCategory, string> = {
  deletion: 'mma-deletion',
  generalization: 'mma-generalization',
  distortion: 'mma-distortion',
}

type ViewState =
  | { kind: 'empty' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'result'; result: AnalysisResult }

export class AnalysisView extends ItemView {
  private state: ViewState = { kind: 'empty' }

  constructor(leaf: WorkspaceLeaf) {
    super(leaf)
  }

  getViewType(): string {
    return VIEW_TYPE_META_MODEL
  }

  getDisplayText(): string {
    return 'Meta-Model analysis'
  }

  getIcon(): string {
    return 'search'
  }

  async onOpen(): Promise<void> {
    this.render()
  }

  setLoading(): void {
    this.state = { kind: 'loading' }
    this.render()
  }

  setError(message: string): void {
    this.state = { kind: 'error', message }
    this.render()
  }

  setResult(result: AnalysisResult): void {
    this.state = { kind: 'result', result }
    this.render()
  }

  private render(): void {
    const root = this.contentEl
    root.empty()
    root.addClass('mma-view')

    root.createEl('h3', { text: 'Meta-Model analysis' })

    if (this.state.kind === 'empty') {
      root.createEl('p', {
        cls: 'mma-muted',
        text: 'Run "Analyze selection / current note" to detect Meta-Model violations.',
      })
      return
    }

    if (this.state.kind === 'loading') {
      root.createEl('p', { cls: 'mma-muted', text: 'Analyzing…' })
      return
    }

    if (this.state.kind === 'error') {
      const box = root.createDiv({ cls: 'mma-error' })
      box.setText(this.state.message)
      return
    }

    const { originalText, annotations } = this.state.result

    const summary = root.createDiv({ cls: 'mma-summary' })
    summary.setText(
      `${annotations.length} violation${annotations.length === 1 ? '' : 's'} found`,
    )

    const body = root.createDiv({ cls: 'mma-text' })

    // Annotations from the core are sorted and non-overlapping; walk the text
    // and emit plain segments interleaved with annotated spans.
    let cursor = 0
    for (const a of annotations) {
      if (a.startOffset > cursor) {
        body.appendText(originalText.slice(cursor, a.startOffset))
      }
      const span = body.createSpan({
        cls: `mma-violation ${CATEGORY_CLASS[a.category]}`,
        text: originalText.slice(a.startOffset, a.endOffset),
      })
      // Native tooltip with the challenge question + classification.
      span.setAttr('title', `${a.category} · ${a.violationType}\n${a.challengeQuestion}`)
      cursor = a.endOffset
    }
    if (cursor < originalText.length) {
      body.appendText(originalText.slice(cursor))
    }
  }

  async onClose(): Promise<void> {
    this.contentEl.empty()
  }
}
