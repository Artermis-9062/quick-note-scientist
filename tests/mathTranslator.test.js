import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { translateMath, toLatex, mapCaret } from '../src/utils/mathTranslator.js';

/** Put input inside the exact delimiters used by the editor, without JS escape ambiguity. */
const block = inner => String.raw`\start ${inner} \end`;

/** Mirror the app's preview pipeline, then ask KaTeX to reject invalid LaTeX. */
function renderPreview(source) {
  // Replacement strings use four dollar signs because replace treats $$ as one literal dollar.
  const markdown = translateMath(source).replace(/[/\\]start/g, '$$$$').replace(/[/\\]end/g, '$$$$');
  const latex = toLatex(markdown).slice(2, -2);
  return katex.renderToString(latex, { throwOnError: true });
}

describe('LaTeX command regressions: red before the fix', () => {
  // A command is already LaTeX; replacing its name creates an invalid backslash-glyph pair.
  it.each([String.raw`\alpha`, String.raw`\beta`, String.raw`\frac{1}{2}`, String.raw`\unknowncommand`, String.raw`\alphabeta`])('preserves command %s', command => {
    expect(translateMath(block(command))).toBe(block(command));
  });

  // Existing LaTeX and new plain shortcuts must coexist in the same completed block.
  it('preserves commands while translating bare shortcuts', () => {
    expect(translateMath(block(String.raw`\alpha + beta + \frac{1}{2}`)))
      .toBe(block(String.raw`\alpha + β + \frac{1}{2}`));
  });

  // Every onChange translates the whole note again; previous fallback commands must stay stable.
  it.each(['frac{1}{2}', 'hat{x}', String.raw`\alpha + \frac{1}{2}`])('is stable across repeated edits: %s', inner => {
    const once = translateMath(block(inner));
    expect(translateMath(once)).toBe(once);
    expect(translateMath(translateMath(once))).toBe(once);
  });

  // An assertion about the actual renderer catches corruption even if string checks miss it.
  it('renders mixed explicit commands without KaTeX errors', () => {
    expect(() => renderPreview(block(String.raw`\alpha + \beta + \frac{1}{2}`))).not.toThrow();
  });

  // Unchanged command text must map every caret offset one-to-one, including adjacent punctuation.
  it('keeps the caret in and after an explicit command', () => {
    const source = block(String.raw`\alpha + 12`);
    const translated = translateMath(source);
    for (let offset = 0; offset <= source.length; offset++) {
      expect(mapCaret(source, translated, offset), `offset ${offset}`).toBe(offset);
    }
  });
});

describe('existing behaviors that the fix must preserve', () => {
  // Empty/nullish input is deliberately returned as supplied by the current public API.
  it.each(['', null, undefined])('preserves empty input %s', input => {
    expect(translateMath(input)).toBe(input);
    expect(toLatex(input)).toBe(input);
  });

  // Translation stays restricted to complete blocks; prose and unfinished typing stay untouched.
  it.each(['the alpha particle', String.raw`\start alpha`, String.raw`alpha \end`, 'alphabet alpha2', String.raw`\alpha outside`])('preserves nonmath input %s', input => {
    expect(translateMath(input)).toBe(input);
  });

  // Word, operator, number, whitespace, and fallback tokens all need preservation coverage.
  it.each([
    ['alpha + beta', 'α + β'],
    ['alpha_0 + beta_2', 'α_0 + β_2'],
    ['alphabet alpha2 12.5', 'alphabet alpha2 12.5'],
    ['x -> y', 'x → y'],
    ['frac{1}{2}', String.raw`\frac{1}{2}`],
    ['alpha\n  beta', 'α\n  β'],
    ['()', '()'],
    ['', ''],
  ])('translates complete block %s', (input, expected) => {
    expect(translateMath(block(input))).toBe(block(expected));
  });

  // Multiple blocks must not accidentally change the prose separating them.
  it('handles multiple blocks and surrounding prose', () => {
    const source = `alpha ${block('beta')} middle ${block('gamma')} omega`;
    expect(translateMath(source)).toBe(`alpha ${block('β')} middle ${block('γ')} omega`);
  });

  // Known symbols with spaces reverse to LaTeX, while ordinary text is untouched.
  it('converts preview symbols only inside dollar blocks', () => {
    expect(toLatex('α outside $$α + β$$ tail')).toBe(String.raw`α outside $$\alpha + \beta$$ tail`);
    expect(toLatex('ordinary text')).toBe('ordinary text');
    expect(toLatex(String.raw`$$\frac{1}{2}$$`)).toBe(String.raw`$$\frac{1}{2}$$`);
  });

  // These valid baseline inputs isolate renderer wiring from the command corruption bug.
  it.each(['alpha + beta', 'frac{1}{2}', '12.5 + x'])('renders current valid shortcut input %s', input => {
    expect(() => renderPreview(block(input))).not.toThrow();
  });

  // Mapping across prose and delimiter boundaries must account for shorter translated words.
  it('maps caret offsets through multiple blocks and delimiters', () => {
    const source = `before ${block('alpha + beta')} after ${block('gamma')} tail`;
    const translated = translateMath(source);
    expect(mapCaret(source, translated, -1)).toBe(0);
    expect(mapCaret(source, translated, source.length + 1)).toBe(translated.length);
    expect(mapCaret(source, translated, 3)).toBe(3);
    const firstInner = source.indexOf('alpha', 7);
    expect(mapCaret(source, translated, firstInner)).toBe(firstInner);
    expect(mapCaret(source, translated, firstInner + 3)).toBe(firstInner + 1);
    const endStart = source.indexOf(String.raw`\end`);
    expect(mapCaret(source, translated, endStart + 2)).toBe(translated.indexOf(String.raw`\end`) + 2);
    const second = source.indexOf('gamma');
    expect(mapCaret(source, translated, second)).toBe(translated.indexOf('γ'));
    const tail = source.indexOf('tail');
    expect(mapCaret(source, translated, tail + 2)).toBe(translated.indexOf('tail') + 2);
  });
});
