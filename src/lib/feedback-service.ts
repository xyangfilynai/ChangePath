import type { FeedbackFormData } from './feedback-types';
import { readStoredJson, writeStoredJson } from './browser-storage';

/** Submission payload — matches form data plus metadata. */
interface FeedbackPayload {
  submittedAt: string;
  formData: FeedbackFormData;
}

/** Abstract submission interface — swap the implementation when a real backend exists. */
interface FeedbackSubmitter {
  submit(payload: FeedbackPayload): Promise<{ ok: boolean }>;
}

/**
 * Placeholder submitter that persists to localStorage.
 * Replace with an API-backed implementation when ready.
 */
const localStorageSubmitter: FeedbackSubmitter = {
  async submit(payload) {
    const key = 'regassess-feedback';
    const existing = readStoredJson(key);
    const records = Array.isArray(existing) ? existing : [];
    records.push(payload);
    return { ok: writeStoredJson(key, records) };
  },
};

/** Default submitter used by the app. */
export const feedbackService: FeedbackSubmitter = localStorageSubmitter;
