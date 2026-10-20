// Caret position utilities for text transformations.

const END_LEN = 4;   // len(\end)

/**
 * Check if a caret position is inside a math block (\start...\end).
 *
 * @param {string} text - Full text content
 * @param {number} caret - Caret position (0-indexed)
 * @returns {boolean} True if caret is inside a math block
 */
export function isCaretInMathBlock(text, caret) {
  if (!text || caret < 0) return false;
  const beforeCaret = text.slice(0, caret);
  // Count \start and \end before caret
  const starts = (beforeCaret.match(/\\start/g) || []).length;
  const ends = (beforeCaret.match(/\\end/g) || []).length;
  return starts > ends;
}

/**
 * Find the position of the matching \end for a \start that contains the caret.
 *
 * @param {string} text - Full text content
 * @param {number} caret - Caret position (0-indexed), must be inside a math block
 * @returns {number|null} Position after the matching \end, or null if not found
 */
export function findMatchingEnd(text, caret) {
  if (!isCaretInMathBlock(text, caret)) return null;

  // Find the \start that opened the current block
  const beforeCaret = text.slice(0, caret);
  const startMatches = [...beforeCaret.matchAll(/\\start/g)];
  if (startMatches.length === 0) return null;

  // The last \start before caret is our block opener
  const lastStart = startMatches[startMatches.length - 1].index;

  // Find the \end after that \start
  const afterStart = text.slice(lastStart);
  const endMatch = afterStart.match(/\\end/);
  if (!endMatch) return null;

  // Position after the \end
  return lastStart + endMatch.index + END_LEN;
}