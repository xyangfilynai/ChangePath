import type { Answers } from './assessment-engine';
import {
  isPlainObject,
  isStringArray,
  readStoredValue,
  readStoredJson,
  removeStoredKeys,
  writeStoredJson,
  writeStoredValue,
} from './browser-storage';

const STORAGE_KEY = 'regassess-answers';
const BLOCK_STORAGE_KEY = 'regassess-block-index';

const isAnswerValue = (value: unknown): value is string | string[] => typeof value === 'string' || isStringArray(value);

export const isAnswersRecord = (value: unknown): value is Answers =>
  isPlainObject(value) && Object.values(value).every((entry) => isAnswerValue(entry));

export const storage = {
  loadAnswers(): Answers {
    const saved = readStoredJson(STORAGE_KEY);
    return isAnswersRecord(saved) ? saved : {};
  },

  saveAnswers(answers: Answers): void {
    writeStoredJson(STORAGE_KEY, answers);
  },

  loadBlockIndex(): number {
    const saved = readStoredValue(BLOCK_STORAGE_KEY);
    const parsed = saved ? Number.parseInt(saved, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  },

  saveBlockIndex(index: number): void {
    writeStoredValue(BLOCK_STORAGE_KEY, String(index));
  },

  clearSession(): void {
    removeStoredKeys(STORAGE_KEY, BLOCK_STORAGE_KEY);
  },

  hasSavedAnswers(): boolean {
    return Object.keys(this.loadAnswers()).length > 0;
  },
};
