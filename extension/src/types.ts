export type ViolationCategory = 'deletion' | 'generalization' | 'distortion'

export type ViolationType =
  | 'simple-deletion'
  | 'comparative-deletion'
  | 'lack-of-referential-index'
  | 'unspecified-verb'
  | 'universal-quantifier'
  | 'modal-operator-necessity'
  | 'modal-operator-possibility'
  | 'nominalization'
  | 'cause-effect'
  | 'mind-reading'
  | 'lost-performative'
  | 'complex-equivalence'
  | 'presupposition'

export interface Annotation {
  startOffset: number
  endOffset: number
  text: string
  violationType: ViolationType
  category: ViolationCategory
  challengeQuestion: string
}

export interface AnalysisResult {
  originalText: string
  annotations: Annotation[]
}

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
