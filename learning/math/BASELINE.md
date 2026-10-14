# Stage 1 baseline: tests before the fix

Recorded on 2026-10-14 from `fix/math-latex-commands`, based on
`origin/mvp-feat` at `06da9a1`. Production `src/App.jsx` and
`src/utils/mathTranslator.js` are unchanged from that base.

| Check | Result | Meaning |
| --- | --- | --- |
| `npm run test:coverage` | 24 passed, 9 failed | Command preservation, repeatability, KaTeX rendering, and caret regressions reproduced |
| `npm run test:learning` | 5 passed, 7 failed | Intentional starter gaps, separate from production tests |
| `npm run test:e2e` | 1 passed, 4 failed | Actual Chromium typing, clipboard paste, subsequent edits, and save/reload reproduced the bug |
| `npm run lint` | Passed | All starter and test code parses and meets current lint rules |
| `npm run build` | Passed | App still builds; existing 601.17 kB bundle warning remains |

## Coverage baseline

Only `src/utils/mathTranslator.js` is included:

- Statements: 98% (98/100)
- Branches: 100% (54/54)
- Functions: 100% (11/11)
- Lines: 97.75% (87/89)

Coverage meets the configured numerical thresholds already, but behavior does not.
The failed assertions make the coverage command exit unsuccessfully; this is
intentional and must not be hidden by weakening or skipping tests.

Open [the HTML coverage report](../../coverage/index.html) and
[the Playwright report](../../playwright-report/index.html). They are generated,
ignored artifacts; rerun commands to regenerate them after changes. LCOV is saved
in `coverage/lcov.info`. Playwright retains each failed test's trace, screenshot,
and error context in `test-results/`.

## Reproduced behavior

- Explicit `\alpha` becomes `\α` and fails KaTeX parsing.
- Explicit `\frac` gains another backslash during translation.
- Previously translated bare `frac` gains backslashes each time later prose is typed.
- Saving and reloading preserves the corrupted text, confirming an editor issue
  rather than a temporary preview-only error.
- Bare `alpha + beta` still translates and renders, with surrounding prose preserved.

## Next step belongs to you

Read [the lesson](./README.md), implement the TODO gaps in
[exercises.js](./exercises.js), and run `npm run test:learning`.
Then request review of your attempt. Production implementation, worked solutions,
and the final green verification are reserved for Stage 2 after that review.
No fixes have been applied or pushed in this checkpoint.
