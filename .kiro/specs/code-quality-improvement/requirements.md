# Requirements Document

## Introduction

This document defines the requirements for a systematic code-quality improvement pass on the RegAssess codebase — a React 19 + TypeScript + Vite regulatory change-assessment application. The improvements target dead code removal, duplication consolidation, structural decomposition, and regression prevention, all under a strict behavior-preservation constraint. Requirements are derived from the approved design document and its audit findings.

## Glossary

- **RegAssess**: The React 19 + TypeScript + Vite single-page application implementing a regulatory change-assessment workflow for AI/ML medical devices
- **App_Component**: The top-level React component in `src/App.tsx` that orchestrates screen routing, answer state, localStorage persistence, block navigation, validation, and inline banner rendering
- **BlockBanners_Component**: A new presentational React component extracted from App_Component, responsible for rendering block-specific contextual banners
- **Storage_Module**: A consolidated TypeScript module (`src/lib/storage.ts`) providing all localStorage read/write/clear operations for assessment session state
- **Assessment_Engine**: The module group under `src/lib/assessment-engine/` containing `computeDerivedState`, `computeDetermination`, `getQuestions`, `changeTaxonomy`, and `types`
- **GenAI_Detection**: Logic that checks whether the user's answer to question A6 includes LLM, Foundation, or Generative model types
- **Test_Suite**: The full set of Vitest test files under `tests/`
- **Typecheck**: The TypeScript compiler invoked via `npx tsc --noEmit` to verify type correctness without emitting output
- **Dead_Code**: Imports, functions, or test cases that are provably unused or provide zero coverage value
- **Test_Fixture_Factory**: A helper function (e.g., `base510k`, `baseDeNovo`, `basePMA`) that produces a default `Answers` object for use in tests
- **Answers**: The `Record<string, any>` type representing user responses to assessment questions
- **DerivedState**: The computed state object returned by `computeDerivedState`, including the `hasGenAI` boolean

## Requirements

### Requirement 1: Dead Code Removal

**User Story:** As a developer, I want provably unused code removed from the codebase, so that the codebase is smaller, easier to navigate, and free of misleading artifacts.

#### Acceptance Criteria

1. WHEN the `fireEvent` import in `tests/feedback-survey.spec.tsx` is identified as unused, THE Codebase SHALL have the unused `fireEvent` import removed from that file
2. WHEN the structural contract test `'dashboard -> assess is the expected navigation order'` in `tests/app-shell.spec.ts` is identified as asserting a hardcoded literal against itself, THE Codebase SHALL have that trivial test removed
3. WHEN dead code is removed, THE Test_Suite SHALL continue to pass with identical results for all remaining tests
4. WHEN dead code is removed, THE Typecheck SHALL pass without errors

### Requirement 2: GenAI Detection Consolidation

**User Story:** As a developer, I want a single source of truth for GenAI detection logic, so that future changes to the detection criteria only need to be made in one place.

#### Acceptance Criteria

1. WHEN `report-basis.ts` needs to determine whether generative AI context is present, THE module SHALL use the `hasGenAI` property from `computeDerivedState` instead of a private `hasGenerativeAIContext` function
2. WHEN the private `hasGenerativeAIContext` function is removed from `report-basis.ts`, THE Assessment_Engine `computeDerivedState` SHALL be the single source of truth for GenAI detection
3. WHEN any valid Answers object is provided, THE consolidated GenAI detection SHALL return the same boolean result that the previous `hasGenerativeAIContext` function returned for that input
4. WHEN the consolidation is complete, THE Typecheck SHALL pass without errors
5. WHEN the consolidation is complete, THE Test_Suite SHALL pass with identical results

### Requirement 3: getChangeLabel Wrapper Removal

**User Story:** As a developer, I want to eliminate the thin `getChangeLabel` wrapper in `case-specific-reasoning.ts`, so that the shared utility in `change-utils.ts` is used directly and the indirection is removed.

#### Acceptance Criteria

1. WHEN `case-specific-reasoning.ts` needs a change label, THE module SHALL call `getChangeLabel` from `change-utils.ts` directly with the appropriate fallback argument instead of using a local wrapper function
2. WHEN the local wrapper is removed, THE output of every call site SHALL produce the same string as the previous wrapper for any valid Answers input
3. WHEN the wrapper removal is complete, THE Typecheck SHALL pass without errors
4. WHEN the wrapper removal is complete, THE Test_Suite SHALL pass with identical results

### Requirement 4: Banner Component Extraction

**User Story:** As a developer, I want the ~130 lines of inline banner rendering extracted from App_Component into a dedicated BlockBanners_Component, so that App_Component is smaller and banner logic is isolated and independently testable.

#### Acceptance Criteria

1. WHEN block-specific contextual banners need to be rendered, THE BlockBanners_Component SHALL accept `blockId`, `answers`, `derivedState`, `currentBlockComplete`, and `currentMissingRequired` as props
2. WHEN the BlockBanners_Component is rendered with any valid combination of props, THE BlockBanners_Component SHALL produce JSX output identical to the current inline banner rendering in App_Component's `renderBlockContent` method
3. WHEN the extraction is complete, THE App_Component SHALL delegate all block-specific banner rendering to BlockBanners_Component
4. THE BlockBanners_Component SHALL be a pure presentational component with no side effects and no state mutations
5. WHEN the extraction is complete, THE Typecheck SHALL pass without errors
6. WHEN the extraction is complete, THE Test_Suite SHALL pass with identical results

### Requirement 5: localStorage Consolidation

**User Story:** As a developer, I want all localStorage operations for assessment session state consolidated into a single Storage_Module, so that storage logic is centralized, duplication is eliminated, and storage behavior is consistent.

#### Acceptance Criteria

1. THE Storage_Module SHALL expose `loadAnswers`, `saveAnswers`, `loadBlockIndex`, `saveBlockIndex`, `clearSession`, and `hasSavedAnswers` functions
2. WHEN `Storage_Module.loadAnswers()` is called, THE Storage_Module SHALL return the same value that the current `loadSavedAnswers` function in App_Component returns for any localStorage state
3. WHEN `Storage_Module.hasSavedAnswers()` is called, THE Storage_Module SHALL return the same boolean that the current `hasSavedAnswers` function in App_Component returns for any localStorage state
4. WHEN `Storage_Module.clearSession()` is called, THE Storage_Module SHALL remove both the answers key and the block-index key from localStorage, replacing the duplicated try/catch blocks in `handleReset` and `handleFullAssessment`
5. IF localStorage is unavailable or throws an error, THEN THE Storage_Module SHALL handle the error gracefully and return safe defaults (empty object for answers, `0` for block index, `false` for hasSavedAnswers)
6. WHEN the consolidation is complete, THE App_Component SHALL use Storage_Module for all localStorage operations instead of inline functions
7. WHEN the consolidation is complete, THE Typecheck SHALL pass without errors
8. WHEN the consolidation is complete, THE Test_Suite SHALL pass with identical results

### Requirement 6: Test Fixture Consolidation

**User Story:** As a developer, I want shared test fixture factories (`base510k`, `baseDeNovo`, `basePMA`) consolidated into a single `tests/helpers.ts` module, so that test setup is consistent and changes to default fixtures propagate to all test files.

#### Acceptance Criteria

1. WHEN test files need a default Answers object for a 510(k) pathway, THE `tests/helpers.ts` module SHALL export a `base510k` factory function that produces an Answers object satisfying all assertions currently passing across the three test files
2. WHEN test files need a default Answers object for a De Novo or PMA pathway, THE `tests/helpers.ts` module SHALL export `baseDeNovo` and `basePMA` factory functions derived from `base510k` with appropriate overrides
3. WHEN the consolidation is complete, THE three test files (`regassess-baseline-engine.spec.ts`, `regassess-credibility-logic.spec.ts`, `regassess-question-visibility.spec.ts`) SHALL import fixture factories from `tests/helpers.ts` instead of defining their own
4. WHEN the consolidation is complete, THE Test_Suite SHALL pass with identical results
5. WHEN the consolidation is complete, THE Typecheck SHALL pass without errors

### Requirement 7: ESLint Suppression Comment Improvement

**User Story:** As a developer, I want the eslint-disable comment in App_Component to include a clear rationale, so that future maintainers understand why the suppression exists and do not remove it inadvertently.

#### Acceptance Criteria

1. WHEN the `eslint-disable-next-line react-hooks/exhaustive-deps` comment at App.tsx line ~328 is encountered, THE comment SHALL include an inline explanation stating that `validationErrors` is intentionally excluded to prevent an infinite loop
2. THE improved comment SHALL not change any runtime behavior or suppress any additional rules
3. WHEN the comment improvement is complete, THE Typecheck SHALL pass without errors
4. WHEN the comment improvement is complete, THE Test_Suite SHALL pass with identical results

### Requirement 8: Regression Prevention

**User Story:** As a developer, I want every code-quality task validated against typecheck and the full test suite, so that no refactoring introduces regressions.

#### Acceptance Criteria

1. WHEN any code-quality task is completed, THE Typecheck (`npx tsc --noEmit`) SHALL pass without errors
2. WHEN any code-quality task is completed, THE Test_Suite (`npx vitest run`) SHALL pass with all tests producing identical results to the pre-change baseline
3. THE Codebase SHALL not introduce any new `eslint-disable`, `@ts-ignore`, or `@ts-expect-error` suppression comments as part of this improvement pass
4. THE Codebase SHALL not modify any files or logic explicitly listed in the "What to Leave Alone" section of the design document

### Requirement 9: Explicit Non-Goals

**User Story:** As a developer, I want the boundaries of this improvement pass clearly defined, so that reviewers and future contributors understand what was intentionally left unchanged and why.

#### Acceptance Criteria

1. THE Codebase SHALL not narrow or change the `Answers = Record<string, any>` type definition in this pass
2. THE Codebase SHALL not refactor the `handleAnswerChange` cascade clearing logic in App_Component in this pass
3. THE Codebase SHALL not split or restructure `computeDetermination.ts` in this pass
4. THE Codebase SHALL not modify the `changeTaxonomy.ts` data structure in this pass
5. THE Codebase SHALL not migrate inline styles to CSS modules, styled-components, or any other styling approach in this pass
6. THE Codebase SHALL not add runtime type guards to `as string` casts on answer values in this pass (these are consequences of the un-narrowed Answers type)
7. THE Codebase SHALL not modify the non-null assertion in `main.tsx` in this pass
