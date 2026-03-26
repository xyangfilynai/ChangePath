# Implementation Plan: Code Quality Improvement

## Overview

Systematic code-quality improvement pass for the RegAssess codebase. Tasks are ordered by confidence and ROI: highest-confidence deletions first, then duplication cleanup, structural refactors, test fixture consolidation, and finally comment improvement. Every task includes typecheck and test validation sub-tasks per Requirement 8.

## Tasks

- [x] 1. Dead code removal
  - [x] 1.1 Remove unused `fireEvent` import from `tests/feedback-survey.spec.tsx`
    - Remove the `fireEvent` import from `@testing-library/react` (it is never called; only `userEvent` is used)
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 1.2 Remove trivial structural contract test from `tests/app-shell.spec.ts`
    - Remove the `'dashboard -> assess is the expected navigation order'` test that asserts a hardcoded literal against itself (zero coverage value)
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 1.3 Validate dead code removal
    - Run `npx tsc --noEmit` and confirm no type errors
    - Run `npx vitest run` and confirm all remaining tests pass
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Duplication cleanup — GenAI detection consolidation
  - [x] 2.1 Replace private `hasGenerativeAIContext` in `report-basis.ts` with `computeDerivedState`
    - Import `computeDerivedState` from `./assessment-engine`
    - In `buildAssessmentBasis`, call `computeDerivedState(answers).hasGenAI` instead of the local `hasGenerativeAIContext(answers)`
    - Remove the private `hasGenerativeAIContext` function
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 2.2 Write property test for GenAI detection equivalence
    - **Property 1: GenAI Detection Equivalence**
    - **Validates: Requirement 2.3**

  - [x] 2.3 Validate GenAI detection consolidation
    - Run `npx tsc --noEmit` and confirm no type errors
    - Run `npx vitest run` and confirm all tests pass with identical results
    - _Requirements: 2.4, 2.5, 8.1, 8.2, 8.3, 8.4_

- [x] 3. Duplication cleanup — `getChangeLabel` wrapper removal
  - [x] 3.1 Remove local `getChangeLabel` wrapper in `case-specific-reasoning.ts`
    - Replace the local wrapper function with direct calls to `getChangeLabel` from `change-utils.ts`, passing `'the change under assessment'` as the fallback argument at each call site
    - _Requirements: 3.1, 3.2_

  - [ ]* 3.2 Write property test for getChangeLabel wrapper equivalence
    - **Property 2: getChangeLabel Wrapper Equivalence**
    - **Validates: Requirement 3.2**

  - [x] 3.3 Validate getChangeLabel wrapper removal
    - Run `npx tsc --noEmit` and confirm no type errors
    - Run `npx vitest run` and confirm all tests pass with identical results
    - _Requirements: 3.3, 3.4, 8.1, 8.2, 8.3, 8.4_

- [x] 4. Checkpoint — Ensure all tests pass after deletion and duplication cleanup
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Structural refactor — Extract BlockBanners component
  - [x] 5.1 Create `src/components/BlockBanners.tsx`
    - Define `BlockBannersProps` interface with `blockId`, `answers`, `derivedState`, `currentBlockComplete`, and `currentMissingRequired` props
    - Extract the ~130 lines of inline banner conditional rendering from `App.tsx`'s `renderBlockContent` method into the new `BlockBanners` component
    - The component must be a pure presentational component with no side effects and no state mutations
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.2 Wire `BlockBanners` into `App.tsx`
    - Import `BlockBanners` in `App.tsx`
    - Replace the inline banner rendering in `renderBlockContent` with `<BlockBanners ... />`
    - _Requirements: 4.3_

  - [ ]* 5.3 Write property test for banner rendering equivalence
    - **Property 3: Banner Rendering Equivalence**
    - **Validates: Requirement 4.2**

  - [x] 5.4 Validate BlockBanners extraction
    - Run `npx tsc --noEmit` and confirm no type errors
    - Run `npx vitest run` and confirm all tests pass with identical results
    - _Requirements: 4.5, 4.6, 8.1, 8.2, 8.3, 8.4_

- [x] 6. Structural refactor — Consolidate localStorage helpers
  - [x] 6.1 Create `src/lib/storage.ts`
    - Implement `loadAnswers`, `saveAnswers`, `loadBlockIndex`, `saveBlockIndex`, `clearSession`, and `hasSavedAnswers` functions
    - Preserve existing error-handling behavior: try/catch with safe defaults (empty object for answers, `0` for block index, `false` for hasSavedAnswers)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Replace inline localStorage usage in `App.tsx` with `storage` module
    - Import `storage` from `./lib/storage`
    - Replace `loadSavedAnswers`, `loadSavedBlockIndex`, `hasSavedAnswers` inline functions with `storage.loadAnswers()`, `storage.loadBlockIndex()`, `storage.hasSavedAnswers()`
    - Replace duplicated `localStorage.removeItem` try/catch blocks in `handleReset` and `handleFullAssessment` with `storage.clearSession()`
    - Replace inline `localStorage.setItem` calls with `storage.saveAnswers()` and `storage.saveBlockIndex()`
    - _Requirements: 5.6_

  - [ ]* 6.3 Write property test for storage function equivalence
    - **Property 4: Storage Function Equivalence**
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 6.4 Write property test for clearSession
    - **Property 5: clearSession Removes All Session Keys**
    - **Validates: Requirement 5.4**

  - [x] 6.5 Validate localStorage consolidation
    - Run `npx tsc --noEmit` and confirm no type errors
    - Run `npx vitest run` and confirm all tests pass with identical results
    - _Requirements: 5.7, 5.8, 8.1, 8.2, 8.3, 8.4_

- [x] 7. Checkpoint — Ensure all tests pass after structural refactors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Test fixture consolidation
  - [x] 8.1 Create `tests/helpers.ts` with shared fixture factories
    - Export `base510k`, `baseDeNovo`, and `basePMA` factory functions
    - `base510k` must produce an Answers object that is a superset of all defaults currently used across the three test files
    - `baseDeNovo` and `basePMA` derive from `base510k` with appropriate pathway overrides
    - _Requirements: 6.1, 6.2_

  - [x] 8.2 Update test files to import from `tests/helpers.ts`
    - Update `tests/regassess-baseline-engine.spec.ts` to import factories from `tests/helpers.ts` and remove local definitions
    - Update `tests/regassess-credibility-logic.spec.ts` to import factories from `tests/helpers.ts` and remove local definitions
    - Update `tests/regassess-question-visibility.spec.ts` to import factories from `tests/helpers.ts` and remove local definitions
    - _Requirements: 6.3_

  - [x] 8.3 Validate test fixture consolidation
    - Run `npx tsc --noEmit` and confirm no type errors
    - Run `npx vitest run` and confirm all tests pass with identical results
    - _Requirements: 6.4, 6.5, 8.1, 8.2, 8.3, 8.4_

- [x] 9. Comment improvement
  - [x] 9.1 Improve eslint-disable comment in `App.tsx`
    - Update the `eslint-disable-next-line react-hooks/exhaustive-deps` comment at ~line 328 to include an inline explanation: `validationErrors` is intentionally excluded to prevent an infinite loop
    - Do not change any runtime behavior or suppress any additional rules
    - _Requirements: 7.1, 7.2_

  - [x] 9.2 Validate comment improvement
    - Run `npx tsc --noEmit` and confirm no type errors
    - Run `npx vitest run` and confirm all tests pass with identical results
    - _Requirements: 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- No files or logic from the "What to Leave Alone" section are modified (Requirement 8.4, Requirement 9)
- Validation (typecheck + full test suite) runs after every task per Requirement 8
