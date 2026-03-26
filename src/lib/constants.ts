// ---------------------------------------------------------------------------
// Application-wide constants
// Keep magic numbers here so every module shares the same source of truth.
// ---------------------------------------------------------------------------

// Time windows (milliseconds)
export const ONE_HOUR_MS = 60 * 60 * 1_000
export const FIFTEEN_MIN_MS = 15 * 60 * 1_000
export const THIRTY_MIN_MS = 30 * 60 * 1_000

// ---------------------------------------------------------------------------
// Rate limits — [maxRequests, windowMs]
// ---------------------------------------------------------------------------
export const RATE_LIMIT_AUTH = { max: 10, window: FIFTEEN_MIN_MS }
export const RATE_LIMIT_SIGNUP = { max: 5, window: ONE_HOUR_MS }
export const RATE_LIMIT_PASSWORD_RESET_REQUEST = { max: 5, window: FIFTEEN_MIN_MS }
export const RATE_LIMIT_PASSWORD_RESET_CONFIRM = { max: 10, window: FIFTEEN_MIN_MS }

export const RATE_LIMIT_RESUME_SAVE = { max: 120, window: ONE_HOUR_MS }
export const RATE_LIMIT_RESUME_DUPLICATE = { max: 10, window: ONE_HOUR_MS }
export const RATE_LIMIT_SNAPSHOT_CREATE = { max: 60, window: ONE_HOUR_MS }
export const RATE_LIMIT_SNAPSHOT_RESTORE = { max: 10, window: ONE_HOUR_MS }

export const RATE_LIMIT_COVER_LETTER = { max: 10, window: ONE_HOUR_MS }
export const RATE_LIMIT_JOB_APPLICATION = { max: 20, window: ONE_HOUR_MS }

export const RATE_LIMIT_AI_IMPROVE = { max: 30, window: ONE_HOUR_MS }
export const RATE_LIMIT_AI_ASSIST = { max: 20, window: ONE_HOUR_MS }
export const RATE_LIMIT_AI_COVER_LETTER = { max: 20, window: ONE_HOUR_MS }

export const RATE_LIMIT_USER_UPDATE = { max: 10, window: ONE_HOUR_MS }
export const RATE_LIMIT_USER_DELETE = { max: 3, window: ONE_HOUR_MS }
export const RATE_LIMIT_USER_EXPORT = { max: 5, window: ONE_HOUR_MS }

export const RATE_LIMIT_CHECKOUT = { max: 10, window: ONE_HOUR_MS }
export const RATE_LIMIT_UPLOAD_SIGN = { max: 20, window: ONE_HOUR_MS }

// ---------------------------------------------------------------------------
// Snapshot / version history
// ---------------------------------------------------------------------------
/** Maximum number of snapshots stored per resume (rolling limit — oldest deleted first). */
export const SNAPSHOT_MAX_PER_RESUME = 10

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export const RESUMES_PER_PAGE = 12
export const COVER_LETTERS_LIST_LIMIT = 50
export const INVOICES_PER_PAGE = 10
export const PROFILE_PRESETS_MAX = 20
export const RESUMES_GROUP_FETCH_MAX = 200

// ---------------------------------------------------------------------------
// AI tokens
// ---------------------------------------------------------------------------
export const AI_MAX_TOKENS_IMPROVE = 800
export const AI_MAX_TOKENS_ASSIST = 400
export const AI_MAX_TOKENS_COVER_LETTER = 1_000

// ---------------------------------------------------------------------------
// UI / UX timing (milliseconds)
// ---------------------------------------------------------------------------
/** Debounce delay before auto-saving the resume after the user stops typing. */
export const AUTOSAVE_DEBOUNCE_MS = 5_000
/** Duration of the silent "Saved ✓" toast. */
export const SAVED_TOAST_DURATION_MS = 1_500

// ---------------------------------------------------------------------------
// Content limits
// ---------------------------------------------------------------------------
export const SNAPSHOT_LABEL_MAX_LENGTH = 80
export const JOB_NOTES_MAX_LENGTH = 5_000
export const JOB_SALARY_MAX_LENGTH = 50
