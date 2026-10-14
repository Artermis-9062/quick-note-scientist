import { describe, expect, it } from 'vitest';
import { readCommand, translateTokens, isStable } from './exercises.js';

describe('exercise 1: command recognition', () => {
  // Commands stop before arguments, digits, and punctuation; offsets refer to the original string.
  it.each([
    [String.raw`\alpha + x`, 0, String.raw`\alpha`, 6],
    [String.raw`x+\frac{1}{2}`, 2, String.raw`\frac`, 7],
    [String.raw`\unknowncommand_0`, 0, String.raw`\unknowncommand`, 15],
    [String.raw`\beta2`, 0, String.raw`\beta`, 5],
  ])('reads a command in %s', (input, start, text, end) => {
    expect(readCommand(input, start)).toEqual({ text, kind: 'command', end });
  });
  // Non-command input remains available to other tokenizer branches.
  it.each(['alpha', '\\', String.raw`\+`, ''])('rejects non-command %s', input => {
    expect(readCommand(input, 0)).toBeNull();
  });
});

describe('exercise 2: token translation', () => {
  // Even a deliberately dangerous lookup entry cannot override a protected command token.
  it('translates shortcuts and preserves commands and whitespace', () => {
    const tokens = [
      { text: String.raw`\alpha`, kind: 'command' },
      { text: ' + ', kind: 'space' },
      { text: 'beta', kind: 'word' },
      { text: '->', kind: 'op' },
      { text: '12', kind: 'number' },
    ];
    expect(translateTokens(tokens, { beta: 'β', '->': '→', [String.raw`\alpha`]: 'WRONG', '12': 'WRONG' }))
      .toBe(String.raw`\alpha + β→12`);
    expect(tokens[2].text).toBe('beta');
  });
  // Unknown words, punctuation, and empty token lists are lossless rather than discarded.
  it('preserves unmatched tokens', () => {
    expect(translateTokens([{ text: 'alphabet', kind: 'word' }, { text: '{}', kind: 'op' }], {})).toBe('alphabet{}');
    expect(translateTokens([], {})).toBe('');
  });
});

describe('exercise 3: stable translation', () => {
  // A first transformation is allowed; only the second transformation must be unchanged.
  it('accepts a stable translator', () => {
    expect(isStable('alpha', text => text === 'alpha' ? 'α' : text)).toBe(true);
  });
  // Adding a slash each time mimics the real fallback bug without leaking its solution.
  it('rejects a translator that keeps adding backslashes', () => {
    expect(isStable('frac', text => '\\' + text)).toBe(false);
  });
});
