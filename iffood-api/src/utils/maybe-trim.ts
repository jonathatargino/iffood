export function forceTrim(value: unknown): string {
  if (typeof value !== 'string') {
    throw new TypeError('Value must be a string to be trimmed');
  }

  return value.trim();
}
