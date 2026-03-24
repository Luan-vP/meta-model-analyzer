import type { ViolationType, ViolationCategory } from '../types/analysis'

export interface ViolationInfo {
  type: ViolationType
  category: ViolationCategory
  displayName: string
  description: string
  exampleChallenge: string
}

export const CATEGORY_COLORS: Record<ViolationCategory, { underline: string; badgeBg: string; badgeText: string }> = {
  deletion: { underline: '#E05252', badgeBg: '#FEE2E2', badgeText: '#991B1B' },
  generalization: { underline: '#0D9488', badgeBg: '#CCFBF1', badgeText: '#115E59' },
  distortion: { underline: '#6366F1', badgeBg: '#E0E7FF', badgeText: '#3730A3' },
}

export const VIOLATION_CATALOGUE: ViolationInfo[] = [
  // Deletions
  {
    type: 'simple-deletion',
    category: 'deletion',
    displayName: 'Simple Deletion',
    description: 'Important information is left out of the surface structure.',
    exampleChallenge: 'About what? About whom?',
  },
  {
    type: 'comparative-deletion',
    category: 'deletion',
    displayName: 'Comparative Deletion',
    description: 'A comparison is made but the standard of comparison is deleted.',
    exampleChallenge: 'Compared to what? Better than what, specifically?',
  },
  {
    type: 'lack-of-referential-index',
    category: 'deletion',
    displayName: 'Lack of Referential Index',
    description: 'A noun phrase does not refer to a specific person or thing.',
    exampleChallenge: 'Who specifically? What specifically?',
  },
  {
    type: 'unspecified-verb',
    category: 'deletion',
    displayName: 'Unspecified Verb',
    description: 'The verb does not specify how the action was performed.',
    exampleChallenge: 'How specifically did they do that?',
  },
  // Generalizations
  {
    type: 'universal-quantifier',
    category: 'generalization',
    displayName: 'Universal Quantifier',
    description: 'Words like "always", "never", "everyone", "nobody" that overgeneralize.',
    exampleChallenge: 'Always? Has there ever been a time when that wasn\'t the case?',
  },
  {
    type: 'modal-operator-necessity',
    category: 'generalization',
    displayName: 'Modal Operator of Necessity',
    description: 'Words like "must", "have to", "should", "need to" implying no choice.',
    exampleChallenge: 'What would happen if you didn\'t? What stops you?',
  },
  {
    type: 'modal-operator-possibility',
    category: 'generalization',
    displayName: 'Modal Operator of Possibility',
    description: 'Words like "can\'t", "impossible", "unable" implying impossibility.',
    exampleChallenge: 'What prevents you? What would happen if you could?',
  },
  {
    type: 'nominalization',
    category: 'generalization',
    displayName: 'Nominalization',
    description: 'A process (verb) has been turned into a static noun/thing.',
    exampleChallenge: 'How specifically are you experiencing that? Who is doing the [verb form]?',
  },
  // Distortions
  {
    type: 'cause-effect',
    category: 'distortion',
    displayName: 'Cause-Effect',
    description: 'An assumed causal link between two events that may not be connected.',
    exampleChallenge: 'How exactly does X cause Y? Has X ever happened without Y?',
  },
  {
    type: 'mind-reading',
    category: 'distortion',
    displayName: 'Mind Reading',
    description: 'Claiming to know another person\'s internal state without evidence.',
    exampleChallenge: 'How do you know that? What specifically makes you think they feel that way?',
  },
  {
    type: 'lost-performative',
    category: 'distortion',
    displayName: 'Lost Performative',
    description: 'A value judgment where the performer of the judgment is missing.',
    exampleChallenge: 'Who says? According to whom? How do you know that\'s true?',
  },
  {
    type: 'complex-equivalence',
    category: 'distortion',
    displayName: 'Complex Equivalence',
    description: 'Two experiences are equated as meaning the same thing.',
    exampleChallenge: 'How does X mean Y? Have you ever experienced X without it meaning Y?',
  },
  {
    type: 'presupposition',
    category: 'distortion',
    displayName: 'Presupposition',
    description: 'An unstated assumption that must be accepted for the sentence to make sense.',
    exampleChallenge: 'What leads you to believe that? How do you know [presupposed thing] is true?',
  },
]

export const VIOLATION_MAP = new Map(VIOLATION_CATALOGUE.map((v) => [v.type, v]))
