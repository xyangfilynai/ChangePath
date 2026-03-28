import { beforeEach, describe, expect, it } from 'vitest';
import { assessmentStore } from '../src/lib/assessment-store';
import { feedbackService } from '../src/lib/feedback-service';
import { createEmptyForm } from '../src/lib/feedback-types';
import { storage } from '../src/lib/storage';

describe('browser persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to an empty answer set when persisted answers are malformed', () => {
    localStorage.setItem('regassess-answers', '{"A1":{"nested":"nope"}}');

    expect(storage.loadAnswers()).toEqual({});
    expect(storage.hasSavedAnswers()).toBe(false);
  });

  it('filters invalid saved assessments and creates versions only on meaningful updates', () => {
    localStorage.setItem(
      'regassess-assessments',
      JSON.stringify([
        {
          id: 'valid-assessment',
          name: 'Stored assessment',
          answers: { A1: '510(k)' },
          blockIndex: 0,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
          versions: [],
          reviewerNotes: [],
          lastPathway: 'Letter to File',
        },
        {
          id: 'broken-assessment',
          name: 'Broken assessment',
          answers: 'not-an-answer-record',
          blockIndex: 0,
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
          versions: [],
          reviewerNotes: [],
        },
      ]),
    );

    expect(assessmentStore.list()).toHaveLength(1);

    const created = assessmentStore.save({
      name: 'Draft review',
      answers: { A1: '510(k)' },
      blockIndex: 0,
      lastPathway: 'Letter to File',
    });

    const unchangedUpdate = assessmentStore.save({
      id: created.id,
      name: created.name,
      answers: { A1: '510(k)' },
      blockIndex: 0,
      lastPathway: 'Letter to File',
    });

    expect(unchangedUpdate.versions).toHaveLength(0);

    const changedUpdate = assessmentStore.save({
      id: created.id,
      name: created.name,
      answers: { A1: '510(k)', B1: 'Training Data' },
      blockIndex: 1,
      lastPathway: 'New Submission Required',
    });

    expect(changedUpdate.versions).toHaveLength(1);
    expect(changedUpdate.versions[0].answers).toEqual({ A1: '510(k)' });
  });

  it('recovers from corrupt feedback storage and appends the new submission', async () => {
    localStorage.setItem('regassess-feedback', '{not valid json');

    const result = await feedbackService.submit({
      submittedAt: '2026-03-28T10:00:00.000Z',
      formData: createEmptyForm(),
    });

    expect(result.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem('regassess-feedback') || '[]')).toHaveLength(1);
  });
});
