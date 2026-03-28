/**
 * Assessment persistence store.
 * Lightweight localStorage-backed multi-assessment storage with version tracking.
 */

import type { Answers } from './assessment-engine';
import { isPlainObject, readStoredJson, writeStoredJson } from './browser-storage';
import { isAnswersRecord } from './storage';

export interface ReviewerNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface AssessmentVersion {
  versionNumber: number;
  answers: Answers;
  timestamp: string;
  note: string;
}

export interface SavedAssessment {
  id: string;
  name: string;
  answers: Answers;
  blockIndex: number;
  createdAt: string;
  updatedAt: string;
  versions: AssessmentVersion[];
  reviewerNotes: ReviewerNote[];
  /** Pathway determination at time of last save */
  lastPathway?: string;
}

const STORE_KEY = 'regassess-assessments';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const isReviewerNote = (value: unknown): value is ReviewerNote =>
  isPlainObject(value) &&
  typeof value.id === 'string' &&
  typeof value.author === 'string' &&
  typeof value.text === 'string' &&
  typeof value.timestamp === 'string';

const isAssessmentVersion = (value: unknown): value is AssessmentVersion =>
  isPlainObject(value) &&
  typeof value.versionNumber === 'number' &&
  isAnswersRecord(value.answers) &&
  typeof value.timestamp === 'string' &&
  typeof value.note === 'string';

const isSavedAssessment = (value: unknown): value is SavedAssessment =>
  isPlainObject(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  isAnswersRecord(value.answers) &&
  typeof value.blockIndex === 'number' &&
  typeof value.createdAt === 'string' &&
  typeof value.updatedAt === 'string' &&
  Array.isArray(value.versions) &&
  value.versions.every((entry) => isAssessmentVersion(entry)) &&
  Array.isArray(value.reviewerNotes) &&
  value.reviewerNotes.every((entry) => isReviewerNote(entry)) &&
  (value.lastPathway === undefined || typeof value.lastPathway === 'string');

const serializeAnswers = (answers: Answers): string =>
  JSON.stringify(
    Object.entries(answers)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, value]),
  );

const hasMeaningfulAssessmentChange = (
  existing: SavedAssessment,
  next: Pick<SavedAssessment, 'name' | 'answers' | 'blockIndex' | 'lastPathway'>,
): boolean =>
  existing.name !== next.name ||
  existing.blockIndex !== next.blockIndex ||
  existing.lastPathway !== next.lastPathway ||
  serializeAnswers(existing.answers) !== serializeAnswers(next.answers);

function loadAll(): SavedAssessment[] {
  const raw = readStoredJson(STORE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry) => isSavedAssessment(entry));
}

function saveAll(assessments: SavedAssessment[]): void {
  writeStoredJson(STORE_KEY, assessments);
}

export const assessmentStore = {
  list(): SavedAssessment[] {
    return loadAll().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  get(id: string): SavedAssessment | undefined {
    return loadAll().find((a) => a.id === id);
  },

  save(
    assessment: Omit<SavedAssessment, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'reviewerNotes'> & {
      id?: string;
    },
  ): SavedAssessment {
    const all = loadAll();
    const now = new Date().toISOString();

    if (assessment.id) {
      // Update existing
      const idx = all.findIndex((a) => a.id === assessment.id);
      if (idx >= 0) {
        const existing = all[idx];
        const nextName = assessment.name || existing.name;
        const nextPayload = {
          name: nextName,
          answers: assessment.answers,
          blockIndex: assessment.blockIndex,
          lastPathway: assessment.lastPathway,
        };
        const versions = hasMeaningfulAssessmentChange(existing, nextPayload)
          ? [
              ...existing.versions,
              {
                versionNumber: existing.versions.length + 1,
                answers: existing.answers,
                timestamp: existing.updatedAt,
                note: 'Snapshot saved before update',
              },
            ]
          : existing.versions;

        all[idx] = {
          ...existing,
          ...nextPayload,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: now,
          versions,
          reviewerNotes: existing.reviewerNotes,
        };
        saveAll(all);
        return all[idx];
      }
    }

    // Create new
    const newAssessment: SavedAssessment = {
      id: generateId(),
      name: assessment.name || `Assessment ${all.length + 1}`,
      answers: assessment.answers,
      blockIndex: assessment.blockIndex,
      createdAt: now,
      updatedAt: now,
      versions: [],
      reviewerNotes: [],
      lastPathway: assessment.lastPathway,
    };
    all.push(newAssessment);
    saveAll(all);
    return newAssessment;
  },

  addNote(id: string, author: string, text: string): void {
    const all = loadAll();
    const idx = all.findIndex((a) => a.id === id);
    if (idx >= 0) {
      all[idx].reviewerNotes.push({
        id: generateId(),
        author,
        text,
        timestamp: new Date().toISOString(),
      });
      all[idx].updatedAt = new Date().toISOString();
      saveAll(all);
    }
  },

  removeNote(assessmentId: string, noteId: string): void {
    const all = loadAll();
    const idx = all.findIndex((a) => a.id === assessmentId);
    if (idx >= 0) {
      all[idx].reviewerNotes = all[idx].reviewerNotes.filter((n) => n.id !== noteId);
      all[idx].updatedAt = new Date().toISOString();
      saveAll(all);
    }
  },

  duplicate(id: string): SavedAssessment | undefined {
    const original = loadAll().find((a) => a.id === id);
    if (!original) return undefined;
    return assessmentStore.save({
      name: `${original.name} (Copy)`,
      answers: { ...original.answers },
      blockIndex: 0,
      lastPathway: original.lastPathway,
    });
  },

  delete(id: string): void {
    const all = loadAll().filter((a) => a.id !== id);
    saveAll(all);
  },
};
