# Fixing bugs - 2026-09-13

Five user-reported issues. Each section: root cause, fix, tests. Format for future plans: `docs/Fixing bugs - <today's date>.md`.

## Section 1 — Preserve raw text in editor (left pane)

**Issue:** Typing `alpha`, `in`, `int` in the textarea gets replaced by symbols immediately. User wants raw text in the left editor; symbols only in the rendered preview.

**Root cause:** `src/App.jsx:147` runs `translateAtBoundary` on every keystroke and stores the translated text in `noteContent`. (Walkthrough 2026-09-10 claimed this was removed; the 2026-09-11 entry re-added it.)

**Fix:** `handleContentChange` → `setNoteContent(e.target.value)` only (still update `isInMathMode`). Remove orphaned `caretRef`/`useLayoutEffect`/`translateAtBoundary`/`mapCaret` usage. Preview pipeline (`translateAll` + `toLatex`) already renders from raw text.

**Tests:** raw text preserved for alpha/in/int; preview still renders symbols; no translation outside math blocks; existing saved notes still render.

## Section 2 — Caret jump into `{}` and Tab navigation

**Issue:** Typing `frac ` creates `\frac{}{}` but the caret does not land in the first `{}`, and Tab does not move to the second `{}`.

**Root cause:** (a) `src/editor/keyboard.js:389` operator-precedence bug: `'\\' + keyword.length + 2` concatenates strings → NaN caret. (b) Tab-to-next-brace was never implemented; `pendingTabAction`/`pendingKeyword` (keyboard.js:171-172) are abandoned scaffolding.

**Fix:** Fix caret computation; add Tab-to-next-`{}`-group when caret is inside a brace group; double-Tab math-block toggle applies only outside `{}` groups. Remove dead variables.

**Tests:** caret lands in first `{}` after frac; Tab moves to second `{}`; Tab at last group falls through; sqrt caret lands correctly; double-Tab toggle still works outside braces.

## Section 3 — Sub/superscript render size

**Issue:** Sub/superscripts render at an inappropriate size ratio.

**Fix:** Add `.katex .scriptstyle` / `.scriptscriptstyle` font-size rule (~75% of base, per Word/LaTeX conventions) in `src/index.css`.

**Tests:** rendered script size ≈ 70–80% of base size.

## Section 4 — Darker box around rendered equations

**Issue:** Rendered equations should sit inside a visibly darker rectangle to mark math-editor output.

**Root cause:** `.katex-display` background is only 40% alpha (`index.css:524-530`); inline math has none.

**Fix:** Deepen `.katex-display` background; add matching background for inline `.katex`.

**Tests:** display and inline math show a clearly distinct dark background.

## Section 5 — Ctrl+Delete not working

**Issue:** Ctrl+Delete (two-press: select block, then delete) does not fire.

**Root cause:** Candidate issues in boundary detection between `isCaretInMathBlock` and `handleCtrlDelete`; also previously exacerbated by live-translation state corruption (Section 1). Will verify with tests and fix the boundary logic.

**Tests:** first press selects enclosing block; second press deletes it; caret at block boundary picks nearest block; outside block = no-op; surrounding content preserved.
