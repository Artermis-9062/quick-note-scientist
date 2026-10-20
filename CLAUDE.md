# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## High-Level Architecture

A math-friendly note-taking app built with React 19 (plain JSX, no TypeScript) and Vite. All application state and view rendering live in a single `App` component in `src/App.jsx`; there is no component layer, no centralized store, and no backend.

**Key Architectural Concerns:**

1. **State Flow:** Plain React `useState` in `src/App.jsx` holds `view`, `notes`, `activeNoteId`, `deletedNotes`, `settings`, etc. View switching is a `view` string union: `'home' | 'editor' | 'notes' | 'deleted' | 'settings'`, rendered as conditional blocks inside `App`.
2. **Editor:** A `<textarea>` plus a live Markdown/KaTeX preview (`react-markdown` + `remark-math` + `rehype-katex`). Custom `\start ... \end` math blocks are preprocessed to `$$...$$` before rendering.
3. **Math Input:** `src/utils/mathTranslator.js` maps ~150 keywords (Greek letters, operators, arrows, etc.) to Unicode/LaTeX. `src/editor/keyboard.js` implements shortcuts: Ctrl+U/I sub/superscript, double-Tab to toggle math blocks, `frac`/`sqrt` expansion, brace-group navigation, correct caret handling via `src/utils/caretUtils.js`.
4. **Persistence:** localStorage only (`scientist-notes`, `scientist-deleted-notes`, `scientist-settings`), with configurable trash auto-purge.

## Development Workflow & Commands

- **Build Command:** `npm run build`
- **Linting:** `npm run lint`
- **Testing:**
  - Run unit tests (Vitest): `npm test`
  - Run e2e tests (Playwright): `npm run test:e2e`

## Project Structure Guidance

- **App:** Everything lives in `src/App.jsx` (state, sidebar nav, and all views).
- **Math translation:** `src/utils/mathTranslator.js` (`KEYWORDS`, `tokenize`, `translateAll`, `translateAtBoundary`, `toLatex`).
- **Caret helpers:** `src/utils/caretUtils.js` (`mapCaret`, `isCaretInMathBlock`, `findMatchingEnd`).
- **Keyboard behavior:** `src/editor/keyboard.js`.
- **Tests:** `src/App.test.jsx` (Vitest), `e2e/editor.spec.js` (Playwright).
