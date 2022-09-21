/**
 * Parses a comma separated value
 *
 * @param {String} value the value to parse
 * @returns {String[]} the parsed value
 */
export const parseCommaSeparatedString = (value: string): string[] => (
  value.split(',').map(v => v.trim())
);
