import type { Answers } from './assessment-engine';

const STORAGE_KEY = 'regassess-answers';
const BLOCK_STORAGE_KEY = 'regassess-block-index';

export const storage = {
  loadAnswers(): Answers {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  },

  saveAnswers(answers: Answers): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Ignore storage errors
    }
  },

  loadBlockIndex(): number {
    try {
      const saved = localStorage.getItem(BLOCK_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : 0;
      return Number.isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  },

  saveBlockIndex(index: number): void {
    try {
      localStorage.setItem(BLOCK_STORAGE_KEY, String(index));
    } catch {
      // Ignore storage errors
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BLOCK_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  },

  hasSavedAnswers(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      return Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  },
};
