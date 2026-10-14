/** Exercise 1: return { text, kind: 'command', end } for a command at start, or null.
 * end is the exclusive index in the original input. Recognize backslash + ASCII letters.
 * This exercise does not parse LaTeX arguments or implement the full production tokenizer.
 */
export function readCommand(input, start) {
  // TODO: Check the character at start, then scan letters without consuming arguments.
  // TODO: Return null if no letters follow the backslash. Preserve the complete command text.
  void input;
  void start;
  return null; // GAP: implement recognition without translating the command name.
}

/** Exercise 2: map {text, kind} tokens through keywords, except command tokens; return text. */
export function translateTokens(tokens, keywords) {
  // TODO: Preserve commands exactly; translate only word/operator tokens with matching keys.
  // TODO: Keep every other token and join the resulting text without inserting separators.
  void tokens;
  void keywords;
  return ''; // GAP: produce a lossless translation of this already-tokenized input.
}

/** Exercise 3: report whether translating once and twice gives exactly the same string. */
export function isStable(input, translate) {
  // TODO: Call translate on input, then on that result. Compare the two outputs.
  void input;
  void translate;
  return false; // GAP: test repeatability rather than comparing output to the original input.
}
