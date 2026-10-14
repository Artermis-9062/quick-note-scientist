# Learning session: preserve LaTeX commands

This is Stage 1, intentionally stopped before the production fix. Read the lesson,
complete the three exercises, and share your attempt for review. The actual
translator has not been changed. Production regression tests are supposed to fail
until Stage 2; exercise failures are separate and never included in required CI.

## Open the right project

This work lives on `fix/math-latex-commands`, based on `origin/mvp-feat`, in:

`/var/home/cpham/Documents/Personal/Project/quick-note-scientist-math`

Open that directory in your editor and terminal. The original
`quick-note-scientist` directory still contains the independent, uncommitted
storage work. This branch uses the original `scientist-notes` storage keys.

## 1. Trace the bug before changing anything

Read [the production translator](../../src/utils/mathTranslator.js), particularly
`tokenize`, `translateSegment`, `toLatex`, and `mapCaret`. Then read
[the regression tests](../../tests/mathTranslator.test.js).

For a note containing `\start \alpha \end`, the existing tokenizer splits the
inner command into an operator token for the backslash and a word token `alpha`.
The word lookup turns `alpha` into `α`, leaving `\α`. KaTeX treats that as an
unknown command. Similarly, `\frac` gets split and translated into `\\frac`.
Every editor change reprocesses the whole note, adding another backslash.

A plain shortcut and a command have different meanings:

| Input inside a complete math block | Intended saved text |
| --- | --- |
| `alpha` | `α` |
| `\alpha` | `\alpha` |
| `frac{1}{2}` | `\frac{1}{2}` |
| `\frac{1}{2}` | `\frac{1}{2}` |
| `\unknowncommand` | Unchanged; validating supported LaTeX is the renderer's job |

The invariant is lossless tokenization: joining token texts reproduces the source.
Translation may replace eligible words/operators, but must never replace a command.
Arguments such as `{1}{2}` remain separate text; we are not building a LaTeX parser.

## 2. Understand backslashes in JavaScript

A normal JavaScript string needs escaped backslashes. The editor's text contains
one literal backslash. `String.raw` lets most examples represent that directly.

```js
// Both variables contain one literal backslash followed by alpha.
// The doubled backslash is JavaScript syntax, not two characters in the note.
const escaped = '\\alpha';
const raw = String.raw`\alpha`;
```

A raw template ending in a lone backslash is a syntax trap because the backslash
escapes its closing backtick. For that specific case, use the ordinary string
`'\\'`. Likewise, JSON and test failure output may display escaped slashes:
count the actual string characters before concluding that the stored note has two.

## 3. Your first coding task: recognize commands

Edit only [exercises.js](./exercises.js), function `readCommand(input, start)`.
The TODOs and placeholder returns are intentional gaps. Delete `void` lines as
you start using their arguments; those lines simply keep unfinished code lintable.

The input is a string and start is a valid nonnegative offset or its length.
Return null unless a literal backslash at that offset is followed by ASCII letters.
Otherwise return `{ text, kind: 'command', end }`; end is exclusive. Stop before
spaces, digits, braces, underscores, punctuation, or the end of the string.

For `x+\frac{1}{2}` starting at offset 2, expect text `\frac` and end 7.
You do not need to implement escaped control symbols, nested math blocks, or
argument parsing for this exercise.

Hints, in order:

1. Check the character at start before scanning anything.
2. Scan letters from the next character; keep a separate cursor.
3. Test whether you consumed at least one letter before returning a token.
4. Slice the original input; do not reconstruct or translate its text.

Run `npm run test:learning -- -t 'exercise 1'`.

## 4. Your second task: translate only eligible tokens

Implement `translateTokens(tokens, keywords)` in the same exercise file.
Each token already has `text` and `kind`. Return a string; do not mutate tokens.
`command`, `space`, and `number` tokens are always preserved. Only `word` and `op`
tokens may use the provided lookup, and unmatched tokens pass through unchanged.
Join without separators so whitespace and punctuation remain exactly as supplied.

Hints:

1. Check eligibility before consulting the lookup.
2. A lookup miss must return the original text, not an empty string.
3. An array transformation followed by joining is sufficient; no global state is needed.

Run `npm run test:learning -- -t 'exercise 2'`.

## 5. Your third task: test repeatability

Implement `isStable(input, translate)`. Call the supplied translator once on input,
then once on the result. Return whether those two outputs are equal. The first
translation may change the input; stability means that further translation does
not change an already translated result. This property is called idempotence.

Hints:

1. Store the first output rather than translating input twice independently.
2. Compare the second output with the first, not with input.

Run `npm run test:learning -- -t 'exercise 3'`, then `npm run test:learning`.
Worked solutions will be added after your attempt is reviewed.

## 6. Why the caret needs the same rules

The editor translates text and then adjusts the caret offset. Bare `alpha` shrinks
from five characters to one, so following offsets shift left by four. An explicit
`\alpha` must retain its six characters, so a caret inside or after it must keep
its offset. Protecting commands only in translation but not in `mapCaret` would
still move the cursor incorrectly. Both must share the same replacement rules.

Try explaining how a caret in `\end` is adjusted when a shortcut earlier in the
block shrinks, and why caret mapping must retain all intervening whitespace.

## 7. Read the coverage report critically

Run `npm run test:coverage`. This uses Vitest's V8 provider rather than JaCoCo,
which measures Java/JVM code. Open `coverage/index.html` for highlighted lines;
`coverage/lcov.info` is the machine-readable equivalent. Reports are generated
even when assertions fail, and only the production translator is measured.

Coverage distinguishes executed statements, lines, functions, and decision
branches. It does **not** prove those statements produced the correct result.
Our baseline demonstrates this: most translator lines run even while command
preservation tests fail. Final targets are 90% lines/statements/functions and 80%
branches, in addition to passing all behavior assertions.

## 8. Browser tests and the red/green sequence

`npm run test:e2e` runs Chromium through Playwright Test. A dedicated Vite server
starts on `http://127.0.0.1:4175`; each test gets isolated storage. Do not start
another server on that port before running the suite.

The suite uses actual typing, actual clipboard paste, later prose edits, save and
reload, caret checks, and rendered KaTeX checks. Read
[the E2E tests](../../e2e/math.spec.js) to compare browser behavior with unit tests.
Use `npx playwright show-report` for the HTML report. Failure traces and screenshots
are retained in `test-results/`. A supported Chromium binary must be installed
with `npx playwright install chromium`; Linux CI also installs system dependencies.
No callable Playwright plugin was available in this session, so tests use its CLI.

After your exercise review, Stage 2 will update the production tokenizer and
replacement/caret rules, make the existing red tests green, add separate reference
solutions, and rerun coverage, E2E, lint, and build. Your exercise functions are
practice interfaces, not a promise to export new functions from the production app.

## Check your understanding before asking for the solution

- Why can `alpha` change while `\alpha` must remain unchanged?
- Why should an unknown command remain intact rather than be deleted?
- How can near-100% coverage coexist with failing tests?
- Why does typing prose after a fraction reproduce this bug?
- What happens if translation preserves a command but caret mapping does not?

Read [BASELINE.md](./BASELINE.md) for the recorded Stage 1 results. Production code
and solutions intentionally remain unfinished until you have tried the exercises.
