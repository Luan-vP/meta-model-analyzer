import type { ViolationType, ViolationCategory } from '../types/analysis'

export interface ExpectedViolation {
  /** Substring (or key phrase) to match in the detected text */
  textMatch: string
  violationType: ViolationType
  category: ViolationCategory
}

export interface BenchmarkEntry {
  id: string
  input: string
  /** Description of what this tests */
  description: string
  expectedViolations: ExpectedViolation[]
}

export const BENCHMARK_DATASET: BenchmarkEntry[] = [
  // ============================================================
  // CLEAN TEXT — should produce 0 violations
  // ============================================================
  {
    id: 'clean-01',
    input: 'I went to the grocery store at 3pm and bought apples, bread, and milk.',
    description: 'Clean: specific actions, times, items',
    expectedViolations: [],
  },
  {
    id: 'clean-02',
    input: 'Sarah called me yesterday to discuss the project. She suggested we move the deadline to Friday.',
    description: 'Clean: specific people, actions, proposals',
    expectedViolations: [],
  },
  {
    id: 'clean-03',
    input: 'The train arrived at platform 4 at exactly 8:15am. I sat in the third carriage and read until Birmingham.',
    description: 'Clean: precise, factual narrative',
    expectedViolations: [],
  },
  {
    id: 'clean-04',
    input: 'My colleague John reviewed the report and found two errors in the calculations on page seven.',
    description: 'Clean: specific person, specific findings',
    expectedViolations: [],
  },
  {
    id: 'clean-05',
    input: 'I feel anxious about the presentation tomorrow because I have not finished the slides yet.',
    description: 'Clean: specific emotion with specific, stated cause',
    expectedViolations: [],
  },

  // ============================================================
  // DELETIONS
  // ============================================================
  {
    id: 'del-simple-01',
    input: "I'm upset.",
    description: 'Simple deletion: emotion without object',
    expectedViolations: [
      { textMatch: "I'm upset", violationType: 'simple-deletion', category: 'deletion' },
    ],
  },
  {
    id: 'del-simple-02',
    input: "I'm scared and I don't know what to do.",
    description: 'Simple deletion: scared of what?',
    expectedViolations: [
      { textMatch: "I'm scared", violationType: 'simple-deletion', category: 'deletion' },
    ],
  },
  {
    id: 'del-comparative-01',
    input: "She's better.",
    description: 'Comparative deletion: better than what?',
    expectedViolations: [
      { textMatch: "She's better", violationType: 'comparative-deletion', category: 'deletion' },
    ],
  },
  {
    id: 'del-comparative-02',
    input: 'Things are getting worse and worse.',
    description: 'Comparative deletion: worse than what?',
    expectedViolations: [
      { textMatch: 'worse', violationType: 'comparative-deletion', category: 'deletion' },
    ],
  },
  {
    id: 'del-comparative-03',
    input: "It's more difficult now.",
    description: 'Comparative deletion: more difficult than when?',
    expectedViolations: [
      { textMatch: 'more difficult', violationType: 'comparative-deletion', category: 'deletion' },
    ],
  },
  {
    id: 'del-refindex-01',
    input: "They don't understand.",
    description: 'Lack of referential index: who are "they"?',
    expectedViolations: [
      { textMatch: 'They', violationType: 'lack-of-referential-index', category: 'deletion' },
    ],
  },
  {
    id: 'del-refindex-02',
    input: 'Someone told me I should quit.',
    description: 'Lack of referential index: who specifically?',
    expectedViolations: [
      { textMatch: 'Someone', violationType: 'lack-of-referential-index', category: 'deletion' },
    ],
  },
  {
    id: 'del-refindex-03',
    input: "People don't like me.",
    description: 'Lack of referential index: which people?',
    expectedViolations: [
      { textMatch: 'People', violationType: 'lack-of-referential-index', category: 'deletion' },
    ],
  },
  {
    id: 'del-unspecverb-01',
    input: 'He hurt me.',
    description: 'Unspecified verb: how specifically?',
    expectedViolations: [
      { textMatch: 'hurt me', violationType: 'unspecified-verb', category: 'deletion' },
    ],
  },
  {
    id: 'del-unspecverb-02',
    input: 'They rejected me.',
    description: 'Unspecified verb: how specifically rejected?',
    expectedViolations: [
      { textMatch: 'rejected', violationType: 'unspecified-verb', category: 'deletion' },
    ],
  },
  {
    id: 'del-unspecverb-03',
    input: 'My parents mistreated me as a child.',
    description: 'Unspecified verb: how specifically?',
    expectedViolations: [
      { textMatch: 'mistreated', violationType: 'unspecified-verb', category: 'deletion' },
    ],
  },

  // ============================================================
  // GENERALIZATIONS
  // ============================================================
  {
    id: 'gen-uq-01',
    input: 'Everyone always ignores me.',
    description: 'Universal quantifier: everyone, always',
    expectedViolations: [
      { textMatch: 'Everyone always', violationType: 'universal-quantifier', category: 'generalization' },
    ],
  },
  {
    id: 'gen-uq-02',
    input: 'Nobody ever listens to what I say.',
    description: 'Universal quantifier: nobody, ever',
    expectedViolations: [
      { textMatch: 'Nobody ever', violationType: 'universal-quantifier', category: 'generalization' },
    ],
  },
  {
    id: 'gen-uq-03',
    input: 'I never get anything right.',
    description: 'Universal quantifier: never, anything',
    expectedViolations: [
      { textMatch: 'never', violationType: 'universal-quantifier', category: 'generalization' },
    ],
  },
  {
    id: 'gen-uq-04',
    input: 'All men are the same.',
    description: 'Universal quantifier: all',
    expectedViolations: [
      { textMatch: 'All men', violationType: 'universal-quantifier', category: 'generalization' },
    ],
  },
  {
    id: 'gen-modal-nec-01',
    input: 'I have to be perfect.',
    description: 'Modal operator of necessity: have to',
    expectedViolations: [
      { textMatch: 'have to', violationType: 'modal-operator-necessity', category: 'generalization' },
    ],
  },
  {
    id: 'gen-modal-nec-02',
    input: 'You should never show weakness.',
    description: 'Modal operator of necessity: should',
    expectedViolations: [
      { textMatch: 'should', violationType: 'modal-operator-necessity', category: 'generalization' },
    ],
  },
  {
    id: 'gen-modal-nec-03',
    input: 'I must keep going no matter what.',
    description: 'Modal operator of necessity: must',
    expectedViolations: [
      { textMatch: 'must', violationType: 'modal-operator-necessity', category: 'generalization' },
    ],
  },
  {
    id: 'gen-modal-pos-01',
    input: "I can't change.",
    description: 'Modal operator of possibility: can\'t',
    expectedViolations: [
      { textMatch: "can't change", violationType: 'modal-operator-possibility', category: 'generalization' },
    ],
  },
  {
    id: 'gen-modal-pos-02',
    input: "It's impossible to be happy in this situation.",
    description: 'Modal operator of possibility: impossible',
    expectedViolations: [
      { textMatch: 'impossible', violationType: 'modal-operator-possibility', category: 'generalization' },
    ],
  },
  {
    id: 'gen-modal-pos-03',
    input: "I'm unable to trust anyone after what happened.",
    description: 'Modal operator of possibility: unable',
    expectedViolations: [
      { textMatch: 'unable', violationType: 'modal-operator-possibility', category: 'generalization' },
    ],
  },
  {
    id: 'gen-nom-01',
    input: 'Our relationship needs work.',
    description: 'Nominalization: relationship (relating → noun)',
    expectedViolations: [
      { textMatch: 'relationship', violationType: 'nominalization', category: 'generalization' },
    ],
  },
  {
    id: 'gen-nom-02',
    input: 'My frustration is overwhelming.',
    description: 'Nominalization: frustration (frustrating → noun)',
    expectedViolations: [
      { textMatch: 'frustration', violationType: 'nominalization', category: 'generalization' },
    ],
  },
  {
    id: 'gen-nom-03',
    input: 'The decision was final and there was no discussion.',
    description: 'Nominalization: decision, discussion',
    expectedViolations: [
      { textMatch: 'decision', violationType: 'nominalization', category: 'generalization' },
      { textMatch: 'discussion', violationType: 'nominalization', category: 'generalization' },
    ],
  },

  // ============================================================
  // DISTORTIONS
  // ============================================================
  {
    id: 'dist-ce-01',
    input: 'He makes me so angry.',
    description: 'Cause-effect: he causes anger',
    expectedViolations: [
      { textMatch: 'makes me so angry', violationType: 'cause-effect', category: 'distortion' },
    ],
  },
  {
    id: 'dist-ce-02',
    input: 'The weather ruins my mood every time.',
    description: 'Cause-effect: weather causes mood',
    expectedViolations: [
      { textMatch: 'weather ruins my mood', violationType: 'cause-effect', category: 'distortion' },
    ],
  },
  {
    id: 'dist-ce-03',
    input: 'Her silence caused my anxiety.',
    description: 'Cause-effect: silence causes anxiety',
    expectedViolations: [
      { textMatch: 'silence caused my anxiety', violationType: 'cause-effect', category: 'distortion' },
    ],
  },
  {
    id: 'dist-mr-01',
    input: "She thinks I'm stupid.",
    description: 'Mind reading: claiming to know thoughts',
    expectedViolations: [
      { textMatch: "thinks I'm stupid", violationType: 'mind-reading', category: 'distortion' },
    ],
  },
  {
    id: 'dist-mr-02',
    input: 'My boss hates me.',
    description: 'Mind reading: claiming to know feelings',
    expectedViolations: [
      { textMatch: 'boss hates me', violationType: 'mind-reading', category: 'distortion' },
    ],
  },
  {
    id: 'dist-mr-03',
    input: "They all know I'm a fraud.",
    description: 'Mind reading: claiming to know what others know',
    expectedViolations: [
      { textMatch: "know I'm a fraud", violationType: 'mind-reading', category: 'distortion' },
    ],
  },
  {
    id: 'dist-lp-01',
    input: "It's wrong to be selfish.",
    description: 'Lost performative: wrong according to whom?',
    expectedViolations: [
      { textMatch: "wrong to be selfish", violationType: 'lost-performative', category: 'distortion' },
    ],
  },
  {
    id: 'dist-lp-02',
    input: "That's the right way to do it.",
    description: 'Lost performative: right according to whom?',
    expectedViolations: [
      { textMatch: 'right way', violationType: 'lost-performative', category: 'distortion' },
    ],
  },
  {
    id: 'dist-lp-03',
    input: "It's bad to show emotions at work.",
    description: 'Lost performative: bad according to whom?',
    expectedViolations: [
      { textMatch: 'bad to show emotions', violationType: 'lost-performative', category: 'distortion' },
    ],
  },
  {
    id: 'dist-ceq-01',
    input: "He didn't call, so he doesn't care.",
    description: 'Complex equivalence: not calling = not caring',
    expectedViolations: [
      { textMatch: "didn't call, so he doesn't care", violationType: 'complex-equivalence', category: 'distortion' },
    ],
  },
  {
    id: 'dist-ceq-02',
    input: "She's quiet, which means she's angry.",
    description: 'Complex equivalence: quiet = angry',
    expectedViolations: [
      { textMatch: "quiet, which means she's angry", violationType: 'complex-equivalence', category: 'distortion' },
    ],
  },
  {
    id: 'dist-ceq-03',
    input: "You're late, so you obviously don't respect my time.",
    description: 'Complex equivalence: late = disrespect',
    expectedViolations: [
      { textMatch: "late, so you obviously don't respect", violationType: 'complex-equivalence', category: 'distortion' },
    ],
  },
  {
    id: 'dist-presup-01',
    input: "If she really loved me, she'd know what I need.",
    description: 'Presupposition: love = mind reading',
    expectedViolations: [
      { textMatch: "If she really loved me, she'd know", violationType: 'presupposition', category: 'distortion' },
    ],
  },
  {
    id: 'dist-presup-02',
    input: 'Why are you always so difficult?',
    description: 'Presupposition: presupposes the person is always difficult',
    expectedViolations: [
      { textMatch: 'Why are you always so difficult', violationType: 'presupposition', category: 'distortion' },
    ],
  },
  {
    id: 'dist-presup-03',
    input: "When will you stop making the same mistakes?",
    description: 'Presupposition: presupposes repeated mistakes',
    expectedViolations: [
      { textMatch: 'stop making the same mistakes', violationType: 'presupposition', category: 'distortion' },
    ],
  },

  // ============================================================
  // MIXED — multiple violation types in one passage
  // ============================================================
  {
    id: 'mixed-01',
    input: "Nobody understands me. I should always put others first. My mother makes me feel guilty. It's wrong to ask for help. Our communication is broken.",
    description: 'Mixed: UQ + modal-necessity + cause-effect + lost-performative + nominalization',
    expectedViolations: [
      { textMatch: 'Nobody', violationType: 'universal-quantifier', category: 'generalization' },
      { textMatch: 'should always', violationType: 'modal-operator-necessity', category: 'generalization' },
      { textMatch: 'mother makes me feel guilty', violationType: 'cause-effect', category: 'distortion' },
      { textMatch: 'wrong to ask for help', violationType: 'lost-performative', category: 'distortion' },
      { textMatch: 'communication', violationType: 'nominalization', category: 'generalization' },
    ],
  },
  {
    id: 'mixed-02',
    input: "Everyone knows I can't do anything right. She makes me angry. It's bad to complain.",
    description: 'Mixed: UQ + modal-possibility + cause-effect + lost-performative',
    expectedViolations: [
      { textMatch: 'Everyone', violationType: 'universal-quantifier', category: 'generalization' },
      { textMatch: "can't do anything", violationType: 'modal-operator-possibility', category: 'generalization' },
      { textMatch: 'makes me angry', violationType: 'cause-effect', category: 'distortion' },
      { textMatch: 'bad to complain', violationType: 'lost-performative', category: 'distortion' },
    ],
  },
  {
    id: 'mixed-03',
    input: "Someone said I'm not good enough. Things are getting better. He didn't reply so he must be mad at me.",
    description: 'Mixed: ref-index + comparative-deletion + complex-equivalence',
    expectedViolations: [
      { textMatch: 'Someone', violationType: 'lack-of-referential-index', category: 'deletion' },
      { textMatch: 'better', violationType: 'comparative-deletion', category: 'deletion' },
      { textMatch: "didn't reply so he must be mad", violationType: 'complex-equivalence', category: 'distortion' },
    ],
  },
]
