import { describe, expect, it } from 'vitest';

/**
 * Baseline tests for the RegAssess decision engine.
 *
 * Adjust the import path after extraction. The target module should export:
 * - Answer
 * - AuthPathway
 * - Pathway
 * - computeDetermination
 * - computeDerivedState
 */
import {
  Answer,
  AuthPathway,
  Pathway,
  computeDetermination,
  computeDerivedState,
} from '../src/lib/assessment-engine';

type Answers = Record<string, any>;

const base510k = (overrides: Answers = {}): Answers => ({
  A1: AuthPathway.FiveOneZeroK,
  A1b: 'K123456',
  A1c: 'v1.0',
  A1d: 'Authorized IFU statement',
  A2: Answer.No,
  A3: ['US'],
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

const baseDeNovo = (overrides: Answers = {}): Answers =>
  base510k({ A1: AuthPathway.DeNovo, ...overrides });

const basePMA = (overrides: Answers = {}): Answers => ({
  A1: AuthPathway.PMA,
  A1b: 'P123456',
  A1c: 'v1.0',
  A1d: 'Authorized IFU statement',
  A2: Answer.No,
  A3: ['US'],
  A6: ['Traditional ML (e.g., random forest, SVM)'],
  B3: Answer.No,
  ...overrides,
});

describe('computeDetermination — 510(k) / De Novo', () => {
  it('routes all-non-significant 510(k) changes to Letter to File', () => {
    const det = computeDetermination(base510k());

    expect(det.pathway).toBe(Pathway.LetterToFile);
    expect(det.allSignificanceNo).toBe(true);
    expect(det.isDocOnly).toBe(true);
    expect(det.isNewSub).toBe(false);
    expect(det.isIncomplete).toBe(false);
  });

  it('routes pure cybersecurity changes to Letter to File', () => {
    const det = computeDetermination(base510k({ C1: Answer.Yes }));

    expect(det.pathway).toBe(Pathway.LetterToFile);
    expect(det.isCyberOnly).toBe(true);
    expect(det.isBugFix).toBe(false);
  });

  it('routes pure restore-to-spec bug fixes to Letter to File', () => {
    const det = computeDetermination(base510k({ C2: Answer.Yes }));

    expect(det.pathway).toBe(Pathway.LetterToFile);
    expect(det.isBugFix).toBe(true);
    expect(det.isCyberOnly).toBe(false);
  });

  it('routes intended-use changes to New Submission Required', () => {
    const det = computeDetermination(base510k({ B3: Answer.Yes }));

    expect(det.pathway).toBe(Pathway.NewSubmission);
    expect(det.isIntendedUseChange).toBe(true);
    expect(det.pccpRecommendation).toEqual({ shouldRecommend: true });
  });

  it('routes intended-use uncertainty conservatively to New Submission Required', () => {
    const det = computeDetermination(base510k({ B3: Answer.Uncertain }));

    expect(det.pathway).toBe(Pathway.NewSubmission);
    expect(det.isIntendedUseUncertain).toBe(true);
    expect(det.isIncomplete).toBe(false);
  });

  it('routes significant changes without PCCP to New Submission Required', () => {
    const det = computeDetermination(base510k({ C3: Answer.Yes }));

    expect(det.pathway).toBe(Pathway.NewSubmission);
    expect(det.isSignificant).toBe(true);
    expect(det.baseSignificant).toBe(true);
    expect(det.pccpRecommendation).toEqual({ shouldRecommend: true });
  });

  it('routes significant changes under verified PCCP scope to Implement Under Authorized PCCP', () => {
    const det = computeDetermination(
      base510k({
        A2: Answer.Yes,
        C3: Answer.Yes,
        P1: Answer.Yes,
        P2: Answer.Yes,
        P3: Answer.Yes,
        P4: Answer.Yes,
        P5: Answer.Yes,
      }),
    );

    expect(det.pathway).toBe(Pathway.ImplementPCCP);
    expect(det.isPCCPImpl).toBe(true);
    expect(det.pccpScopeVerified).toBe(true);
    expect(det.pccpIncomplete).toBe(false);
  });

  it('routes significant changes with partially answered PCCP scope to Assessment Incomplete', () => {
    const det = computeDetermination(
      base510k({
        A2: Answer.Yes,
        C3: Answer.Yes,
        P1: Answer.Yes,
        P2: Answer.Uncertain,
      }),
    );

    expect(det.pathway).toBe(Pathway.AssessmentIncomplete);
    expect(det.pccpScopeVerified).toBe(false);
    expect(det.pccpScopeFailed).toBe(false);
    expect(det.pccpIncomplete).toBe(true);
  });

  it('escalates cumulative drift plus unsupported substantial equivalence to New Submission Required', () => {
    const det = computeDetermination(
      base510k({
        C10: Answer.Yes,
        C11: Answer.No,
      }),
    );

    expect(det.pathway).toBe(Pathway.NewSubmission);
    expect(det.cumulativeEscalation).toBe(true);
    expect(det.seNotSupportable).toBe(true);
    expect(det.isSignificant).toBe(true);
  });

  it('marks cumulative-drift cases incomplete when C11 is still missing', () => {
    const det = computeDetermination(
      base510k({
        C10: Answer.Yes,
      }),
    );

    expect(det.pathway).toBe(Pathway.AssessmentIncomplete);
    expect(det.cumulativeEscalation).toBe(true);
    expect(det.significanceIncomplete).toBe(true);
    expect(det.seNotSupportable).toBe(false);
  });

  it('routes failed De Novo device-type fit to New Submission Required even if significance answers are all No', () => {
    const det = computeDetermination(
      baseDeNovo({
        C0_DN1: Answer.No,
      }),
    );

    expect(det.pathway).toBe(Pathway.NewSubmission);
    expect(det.deNovoDeviceTypeFitFailed).toBe(true);
    expect(det.consistencyIssues.join(' ')).toContain('device type / special controls');
  });

  it('marks uncertain De Novo device-type fit as Assessment Incomplete', () => {
    const det = computeDetermination(
      baseDeNovo({
        C0_DN1: Answer.Uncertain,
      }),
    );

    expect(det.pathway).toBe(Pathway.AssessmentIncomplete);
    expect(det.significanceIncomplete).toBe(true);
    expect(det.consistencyIssues.join(' ')).toContain('continued fit');
  });

  it('flags missing baseline fields without blocking a non-significant Letter to File result', () => {
    const det = computeDetermination(
      base510k({
        A1b: undefined,
      }),
    );

    expect(det.pathway).toBe(Pathway.LetterToFile);
    expect(det.baselineIncomplete).toBe(true);
    expect(det.consistencyIssues.join(' ')).toContain('baseline fields');
  });

  it('flags GenAI guardrail inconsistency when D4 is Yes but C5 is No', () => {
    const det = computeDetermination(
      base510k({
        D4: Answer.Yes,
        C5: Answer.No,
      }),
    );

    expect(det.genAIHighImpactChange).toBe(true);
    expect(det.consistencyIssues.join(' ')).toContain('guardrail / safety filter');
  });

  it('flags foundation-model inconsistency when D1 is Yes but all significance answers are No', () => {
    const det = computeDetermination(
      base510k({
        D1: Answer.Yes,
      }),
    );

    expect(det.genAIHighImpactChange).toBe(true);
    expect(det.consistencyIssues.join(' ')).toContain('foundation/base model change');
  });

  it('flags demographic expansion inconsistency when E3 is Yes but B3 is No', () => {
    const det = computeDetermination(
      base510k({
        E3: Answer.Yes,
      }),
    );

    expect(det.consistencyIssues.join(' ')).toContain('demographic populations');
  });
});

describe('computeDetermination — PMA', () => {
  it('marks PMA assessments incomplete when PMA significance questions are not yet answered', () => {
    const det = computeDetermination(basePMA());

    expect(det.pathway).toBe(Pathway.AssessmentIncomplete);
    expect(det.pmaIncomplete).toBe(true);
  });

  it('routes non-significant PMA changes to PMA Annual Report / Letter to File', () => {
    const det = computeDetermination(
      basePMA({
        C_PMA1: Answer.No,
        C_PMA2: Answer.No,
        C_PMA3: Answer.No,
      }),
    );

    expect(det.pathway).toBe(Pathway.PMAAnnualReport);
    expect(det.isDocOnly).toBe(true);
    expect(det.pmaRequiresSupplement).toBe(false);
  });

  it('routes PMA intended-use changes to PMA Supplement Required', () => {
    const det = computeDetermination(basePMA({ B3: Answer.Yes }));

    expect(det.pathway).toBe(Pathway.PMASupplementRequired);
    expect(det.isNewSub).toBe(true);
  });

  it('routes PMA safety/effectiveness-impact changes to PMA Supplement Required', () => {
    const det = computeDetermination(
      basePMA({
        C_PMA1: Answer.Yes,
        C_PMA2: Answer.No,
        C_PMA3: Answer.No,
      }),
    );

    expect(det.pathway).toBe(Pathway.PMASupplementRequired);
    expect(det.pmaRequiresSupplement).toBe(true);
  });

  it('routes PMA supplement-triggering changes under verified PCCP scope to Implement Under Authorized PCCP', () => {
    const det = computeDetermination(
      basePMA({
        A2: Answer.Yes,
        C_PMA1: Answer.Yes,
        C_PMA2: Answer.No,
        C_PMA3: Answer.No,
        P1: Answer.Yes,
        P2: Answer.Yes,
        P3: Answer.Yes,
        P4: Answer.Yes,
        P5: Answer.Yes,
      }),
    );

    expect(det.pathway).toBe(Pathway.ImplementPCCP);
    expect(det.pccpScopeVerified).toBe(true);
    expect(det.pmaRequiresSupplement).toBe(true);
  });

  it('marks PMA supplement-triggering changes incomplete when PCCP scope review is partial', () => {
    const det = computeDetermination(
      basePMA({
        A2: Answer.Yes,
        C_PMA1: Answer.Yes,
        C_PMA2: Answer.No,
        C_PMA3: Answer.No,
        P1: Answer.Yes,
        P2: Answer.Uncertain,
      }),
    );

    expect(det.pathway).toBe(Pathway.AssessmentIncomplete);
    expect(det.pccpIncomplete).toBe(true);
  });
});

describe('computeDerivedState', () => {
  it('detects generative/foundation AI and market rollups correctly', () => {
    const state = computeDerivedState({
      A1: AuthPathway.FiveOneZeroK,
      A2: Answer.Yes,
      A3: ['US', 'EU', 'UK'],
      A5: Answer.Yes,
      A5b: Answer.No,
      A6: ['LLM / Foundation Model', 'Generative AI'],
      B1: 'Foundation Model / Generative AI',
    });

    expect(state.hasGenAI).toBe(true);
    expect(state.hasEU).toBe(true);
    expect(state.hasUK).toBe(true);
    expect(state.hasNonUSMarket).toBe(true);
    expect(state.isMultiMarket).toBe(true);
    expect(state.euHighRisk).toBe(true);
    expect(state.hasPCCP).toBe(true);
    expect(state.is510k).toBe(true);
  });

  it('does not mark EU high-risk without EU market presence', () => {
    const state = computeDerivedState({
      A1: AuthPathway.DeNovo,
      A2: Answer.No,
      A3: ['US', 'Canada'],
      A5: Answer.Yes,
      A6: ['Deep Learning (e.g., CNN, RNN)'],
      B1: 'Training Data',
    });

    expect(state.hasEU).toBe(false);
    expect(state.euHighRisk).toBe(false);
    expect(state.hasCanada).toBe(true);
    expect(state.isDeNovo).toBe(true);
    expect(state.hasGenAI).toBe(false);
  });
});
