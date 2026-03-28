# ChangePath

ChangePath is a Vite + React + TypeScript prototype for structured regulatory pathway assessment of changes to AI-enabled medical devices. It guides a reviewer through device context, change classification, significance review, PCCP scope checks, population/equity considerations, and a final assessment record with export support.

## What This Repo Contains

- `src/App.tsx`: top-level screen composition for dashboard, assessment, feedback, and handoff flows.
- `src/hooks/useAssessmentWorkspace.ts`: assessment session orchestration, saved-library workflow, and browser draft persistence.
- `src/lib/assessment-engine/`: core pathway logic, question visibility, change taxonomy, and derived state.
- `src/lib/`: report generation, review insights, evidence gaps, persistence, content libraries, and supporting domain utilities.
- `src/components/`: UI for the dashboard, assessment layout, question cards, review panel, and handoff checklist.
- `src/sample-cases/`: source-controlled scenarios used for product demos and regression coverage.
- `tests/`: Vitest and Testing Library coverage for engine logic, UI workflows, persistence, and report output.

## Local Development

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Run the main validation suite with `npm run check-all`.

Available scripts:

- `npm run dev`: start the Vite dev server.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run type-check`: run TypeScript without emitting files.
- `npm run lint`: run ESLint over `src/` and `tests/`.
- `npm run test`: run the Vitest suite.
- `npm run test:coverage`: run tests with coverage output.
- `npm run check-all`: type-check, lint, format-check, and test in sequence.

## Architecture Notes

- The assessment engine is intentionally centralized and mostly declarative. `computeDetermination.ts`, `getQuestions.ts`, and `changeTaxonomy.ts` are large because they encode regulatory rules and structured content rather than generic UI logic.
- Browser persistence is split into two layers:
- `src/lib/storage.ts` stores the in-progress browser draft.
- `src/lib/assessment-store.ts` stores named library records, reviewer notes, and version snapshots.
- Shared low-level storage access lives in `src/lib/browser-storage.ts`, which guards against malformed or corrupted persisted data before it reaches the rest of the app.
- Review panel assembly is isolated in `src/hooks/useReviewPanelData.ts`, keeping heavy derived-state logic out of the rendering component.

## Persistence Model

- The in-progress draft is stored in browser `localStorage` and is used by the dashboard's "Resume current assessment" entry point.
- "Save to library" creates or updates a named assessment record that can be reopened from the dashboard.
- Saved library records preserve reviewer notes and maintain version snapshots only when a meaningful change is saved, which avoids noisy version history from identical updates.
- Sample cases never overwrite the in-progress browser draft.

## Testing Approach

- Engine-focused tests validate pathway logic, question visibility, cumulative change handling, and report generation.
- UI workflow tests exercise the dashboard, layout, review panel, and end-to-end interaction paths.
- Persistence tests cover malformed browser storage, saved-assessment filtering, and feedback submission fallback behavior.

## Current Engineering Priorities

- Keep domain-rule changes deliberate and well-tested, because the assessment engine is the highest-risk area for regressions.
- Prefer extracting orchestration, persistence, and presentational concerns away from `App.tsx` and top-level UI components instead of adding more logic inline.
- Treat browser persistence as untrusted input and validate it before use.
