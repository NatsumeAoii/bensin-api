const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 100;

/**
 * Validates a slug parameter against the expected format.
 * A valid slug consists of lowercase alphanumeric segments separated by single hyphens,
 * with a maximum length of 100 characters.
 *
 * @param slug - The slug string to validate (may be undefined from route params)
 * @returns Type-narrowed boolean — true if slug is a valid, defined string
 */
export function isValidSlug(slug: string | undefined): slug is string {
  if (!slug || slug.length > MAX_SLUG_LENGTH) return false;
  return SLUG_PATTERN.test(slug);
}
