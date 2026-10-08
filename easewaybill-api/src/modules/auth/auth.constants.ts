// Bump this whenever your actual Terms & Conditions text changes — existing
// users won't be forced to re-accept automatically by this alone; that's a
// separate decision (e.g. a middleware check comparing termsVersion on
// login) if you want it. For now this just records what version a new
// registrant agreed to.
export const CURRENT_TERMS_VERSION = '2026-07-27';

export const EMAIL_VERIFICATION_TOKEN_TYPE = 'email_verification' as const;