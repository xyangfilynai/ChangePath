import { Answer, AuthPathway, type Answers } from '../src/lib/assessment-engine';

export const base510k = (overrides: Answers = {}): Answers => ({
  A1: AuthPathway.FiveOneZeroK,
  A1b: 'K123456',
  A1c: 'v1.0',
  A1d: 'Authorized IFU statement',
  A2: Answer.No,
  A6: ['Traditional ML (e.g., random forest, SVM)'],
  B3: Answer.No,
  C1: Answer.No,
  C2: Answer.No,
  C3: Answer.No,
  C4: Answer.No,
  C5: Answer.No,
  C6: Answer.No,
  ...overrides,
});

export const baseDeNovo = (overrides: Answers = {}): Answers =>
  base510k({ A1: AuthPathway.DeNovo, ...overrides });

export const basePMA = (overrides: Answers = {}): Answers => ({
  A1: AuthPathway.PMA,
  A1b: 'P123456',
  A1c: 'v1.0',
  A1d: 'Authorized IFU statement',
  A2: Answer.No,
  A6: ['Traditional ML (e.g., random forest, SVM)'],
  B3: Answer.No,
  ...overrides,
});
