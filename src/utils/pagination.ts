// src/utils/pagination.ts
export interface CursorPaginationParams {
  cursor?: string; // userId or any unique field
  limit?: number;
}

export interface CursorPageResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function normalizeLimit(limit?: number): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}
