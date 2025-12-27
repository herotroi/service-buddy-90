// Utility functions for security in edge functions

/**
 * Escapes special characters used in ILIKE patterns to prevent pattern injection attacks
 * Characters escaped: %, _, \
 */
export function escapeILIKE(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Validates that a string is a valid UUID v4 format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates that a string is a valid ISO 8601 date
 */
export function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Sanitizes a string for safe use in queries
 * - Trims whitespace
 * - Limits length to maxLength characters
 * - Removes control characters
 */
export function sanitizeString(input: string, maxLength: number = 200): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove control characters except newlines and tabs
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim and limit length
  return cleaned.trim().substring(0, maxLength);
}

/**
 * Maps internal error messages to safe user-facing messages
 * This prevents leaking sensitive information about the system
 */
export function getSafeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An error occurred processing your request';
  }

  const message = error.message.toLowerCase();

  // Authentication/Authorization errors
  if (message.includes('jwt') || message.includes('auth') || message.includes('token')) {
    return 'Authentication failed';
  }

  // Not found errors
  if (message.includes('not found') || message.includes('no rows')) {
    return 'Resource not found';
  }

  // UUID/Format errors
  if (message.includes('uuid') || message.includes('invalid input syntax')) {
    return 'Invalid request format';
  }

  // Constraint violations
  if (message.includes('constraint') || message.includes('violates')) {
    return 'Operation not allowed due to data constraints';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many requests, please try again later';
  }

  // Default generic message
  return 'An error occurred processing your request';
}
