// Domain types come from the shared hexagon (`@core`); only the extension's own
// message/settings shapes live here.
export type { Annotation, AnalysisResult, ViolationCategory, ViolationType } from '@core'
import type { AnalysisResult } from '@core'

// Messages between popup, content script, and background
export interface ExtensionMessage {
  type: string
  payload?: unknown
}

export interface AnalyzeTextMessage extends ExtensionMessage {
  type: 'analyze_text'
  payload: {
    text: string
    modelName: string
    ollamaUrl: string
  }
}

export interface AnalysisReadyMessage extends ExtensionMessage {
  type: 'analysis_ready'
  payload: AnalysisResult
}

export interface AnalysisErrorMessage extends ExtensionMessage {
  type: 'analysis_error'
  payload: { message: string }
}

export interface ShowOverlayMessage extends ExtensionMessage {
  type: 'show_overlay'
  payload: AnalysisResult
}

export interface HideOverlayMessage extends ExtensionMessage {
  type: 'hide_overlay'
}

export interface GetSelectedTextMessage extends ExtensionMessage {
  type: 'get_selected_text'
}

export interface SelectedTextMessage extends ExtensionMessage {
  type: 'selected_text'
  payload: { text: string }
}

export interface ExtensionSettings {
  ollamaUrl: string
  modelName: string
}
