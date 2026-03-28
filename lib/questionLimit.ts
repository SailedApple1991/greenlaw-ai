// lib/questionLimit.ts

const STORAGE_KEY = "greenlaw_question_count";
const UNLOCK_KEY = "greenlaw_unlocked";
const QUESTION_LIMIT = 10;

export function getQuestionCount(): number {
  if (typeof window === "undefined") return 0;
  const count = localStorage.getItem(STORAGE_KEY);
  return count ? parseInt(count, 10) : 0;
}

export function incrementQuestionCount(): number {
  const current = getQuestionCount();
  const next = current + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(UNLOCK_KEY) === "true";
}

export function setUnlocked(): void {
  localStorage.setItem(UNLOCK_KEY, "true");
}

export function hasReachedLimit(): boolean {
  if (isUnlocked()) return false;
  return getQuestionCount() >= QUESTION_LIMIT;
}

export function getRemainingQuestions(): number {
  if (isUnlocked()) return Infinity;
  return Math.max(0, QUESTION_LIMIT - getQuestionCount());
}

export const QUESTION_LIMIT_VALUE = QUESTION_LIMIT;
