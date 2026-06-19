// Domain types for the Meta-Model analysis hexagon.
// Pure data shapes — no framework, DOM, or provider dependencies.

export type ViolationCategory = 'deletion' | 'generalization' | 'distortion'

export type ViolationType =
  // Deletions
  | 'simple-deletion'
  | 'comparative-deletion'
  | 'lack-of-referential-index'
  | 'unspecified-verb'
  // Generalizations
  | 'universal-quantifier'
  | 'modal-operator-necessity'
  | 'modal-operator-possibility'
  | 'nominalization'
  // Distortions
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
