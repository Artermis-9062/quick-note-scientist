# Current errors and resolution plan — 2026-10-13

## Review scope

Reviewed application source, styles, translator and caret helpers, test suites, build/lint/test configuration, package manifest and lockfile metadata, shortcut reference, README, CLAUDE.md, September walkthrough, and September 13 bug report. The keyboard module was inspected as bytes because it is not readable JavaScript. Generated dependency/build/report contents are not authoritative application source.

The application is React with a textarea editor, Markdown/KaTeX preview, keyboard math shortcuts, and localStorage persistence for notes, trash, and settings. Most application behavior lives in App.jsx.

Existing uncommitted changes must be preserved. This review changes no application code.

## Current evidence

### Blocking file integrity failures

- `src/editor/keyboard.js` contains 1,236 null bytes in a 17,374-byte file. `node --check src/editor/keyboard.js` fails with `SyntaxError: Invalid or unexpected token` on line 1. App.jsx imports this file, so application startup is blocked even after dependencies are repaired.
- `npm run build` fails loading `node_modules/vite/dist/node/cli.js` with a syntax error. That dependency file also contains binary data.
- `npm test` fails loading a Vitest dependency with a syntax error before test discovery.
- `npm run lint` fails loading an ESLint dependency with a syntax error before linting source.
- The cause of these file changes is unknown. These are file integrity failures, not evidence of a particular Node compatibility problem.
- The keyboard module is untracked and absent from the current Git tree, so restoring it from HEAD is not a recovery option.

### Status of the September 13 report

| Reported issue | Current status | Required action |
| --- | --- | --- |
| Raw text replaced by symbols | Source fix already present: handleContentChange stores raw textarea text; translation is confined to preview | Verify raw typing, saving/reopening, and preview with regressions |
| frac/sqrt caret and Tab navigation | Cannot inspect or execute current keyboard implementation due to binary contents | Recover source, reproduce, then fix exact caret offsets and argument navigation |
| Sub/superscript size | A 0.75em override exists, but targets specific KaTeX internal classes | Verify actual computed sizes and visual layout before changing CSS |
| Darker equation rectangles | Dark background rules exist for inline and display math | Verify contrast, padding, overflow, and nested formula appearance |
| Two-press Ctrl+Delete | Current keyboard behavior cannot be verified; helper boundary logic has weaknesses | Recover module, reproduce select/delete sequence, and define boundary behavior |

### Additional source findings

- `src/App.test.jsx` imports `translateAtBoundary` and `mapCaret`, neither of which is exported by the current utilities. Once the toolchain starts, these imports will prevent the suite from loading.
- Several integration tests only assert that the textarea exists; they do not verify the behavior named by the test.
- Browser tests expect alpha/beta/etc. to become Unicode inside the textarea, contradicting the raw-editor requirement. Historical passing reports do not establish current correctness.
- `findMatchingEnd` chooses the last start marker before the caret and its first following end marker. For a caret in outer text after an inner block, a direct probe returns position 30 although the caret is at 31 and the outer endpoint is 41.
- Math marker handling differs across preprocessing, translation, badges, and caret detection: preprocessing accepts slash and backslash prefixes, while the other paths generally recognize backslash blocks. Marker replacement is also unconditional, including inside Markdown code.
- Unicode-to-LaTeX conversion depends on whole operator tokens, so spacing/punctuation changes the output: `alpha + beta` produces explicit commands, while `alpha+beta` and fraction arguments retain Unicode. Verify both rendering paths. The reverse map also mechanically constructs commands such as `\hplanck`, `\equilibrium`, `\precipitate`, and `\gas`; audit these against actual renderer support. `sum` and `prod` become `\Sigma` and `\Pi`, losing mathematical operator semantics.
- Storage reads use unguarded JSON.parse and no shape validation. Invalid stored JSON can break startup; unexpected note/settings values can break rendering or retention behavior. Writes can fail without useful feedback.
- Trash expiration and countdowns have no clock-driven refresh; they update when relevant state changes or the app reloads.
- The keyboard effect passes a callback capturing noteContent but depends only on view. Whether this causes stale reads depends on the recovered keyboard implementation.

## Ordered implementation plan

### 1. Recover a runnable baseline

Preserve all modified/untracked source and the unreadable keyboard file before recovery. Search editor history, backups, or another checkout for the latest readable keyboard source. If none exists, reconstruct only the documented shortcut behavior with focused tests. Reinstall dependencies from the existing lockfile with `npm ci`; do not upgrade packages as part of recovery. Check recovered source syntax, start the dev server, then rerun build, unit tests, lint, and browser tests to collect actual application failures.

**Exit criterion:** readable keyboard source, executable tooling, and a fresh baseline of failures. If dependency files become unreadable again, investigate the repeatable file transformation before continuing feature repairs.

### 2. Make regression tests reflect intended behavior

Remove tests/imports for abandoned live-translation helpers. Assert exact editor content, selectionStart/selectionEnd, rendered equations, and saved content. Change browser tests to require raw keywords in the textarea and rendered symbols in the preview. Add focused regressions for each of the five reported issues before changing the corresponding behavior.

**Exit criterion:** tests load successfully and each unresolved issue has a meaningful reproduction, rather than a textarea-exists assertion.

### 3. Repair keyboard expansion, navigation, and deletion

Verify frac/dfrac/tfrac/binom expansion and sqrt optional-index/argument placement. Compute caret offsets numerically from the replacement start; restore selection after the controlled textarea update. Make Tab/Enter navigation stay within the current command's argument groups, including nested groups, without jumping into another equation. Give brace navigation precedence over double-Tab. Clear pending Tab timers on editor teardown and verify intervening typing cannot insert delayed spaces at a stale position.

For Ctrl+Delete, handle an already selected complete math block before testing whether its starting caret is inside a block. First press selects the exact enclosing block; second press deletes that same selection and preserves surrounding content. Retain native word deletion outside math blocks, consistent with the September 11 behavior. Specify boundary handling explicitly. For nesting, either support matching depth consistently or treat nested blocks as unsupported; do not let individual helpers disagree.

**Exit criterion:** exact caret and selection assertions pass for expansion, group navigation, double-Tab entry/exit, two-press deletion, boundaries, and native Ctrl+Delete/Ctrl+Backspace outside math.

### 4. Stabilize preview and verify equation styling

Use explicit supported LaTeX mappings for mathematical operators and aliases, avoiding commands inferred from arbitrary shortcut names. Preserve existing commands and existing saved Unicode content. Test compact expressions, fractions, roots, scripts, chemistry shortcuts, incomplete blocks, and multiple blocks. Align marker parsing across preview and caret helpers and preserve code examples. Measure script sizing in a real browser and adjust only selectors that actually control it; visually inspect inline/display boxes and long equations.

**Exit criterion:** representative expressions render without KaTeX errors, prose/code stays intact, and the requested script proportions and darker rectangles are verified visually.

### 5. Harden note persistence and retention

Add guarded storage loading with validation of note arrays, content, timestamps, and supported purge settings. Preserve malformed stored data for recovery rather than silently overwriting it. Report failed writes so Save cannot claim success when persistence failed. If expiration while the app stays open is intended, add a cleaned-up timer to refresh countdowns and purge due notes. Verify save/reload, edit, trash, restore, permanent deletion, Never retention, and expiration.

**Exit criterion:** bad storage does not crash startup or cause unintended purging, successful saves survive reload, and retention behaves consistently.

### 6. Final validation and documentation

Resolve actual lint findings, including test/config globals and hook dependencies, after the toolchain is healthy. Run `npm run build`, `npm run lint`, `npm test`, and `npm run test:e2e`. Record new results and replace obsolete behavior claims in the walkthrough, shortcuts reference, and template README. Keep this work limited to recovery and bug fixes; a component/store rewrite is not required.

**Completion criterion:** all four commands pass on the repaired checkout, the five reported issues have behavioral coverage, visual checks pass, and remaining limitations are documented accurately.
