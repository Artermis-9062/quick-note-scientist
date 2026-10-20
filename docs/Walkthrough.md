# Walkthrough: Math Editor Redesign

**Date:** 2026-09-10  
**Session:** Complete math editor overhaul with keyboard-driven UX

---

## Summary

Complete redesign of the math editor to fix caret jumping, keyword expansion, and navigation issues. The editor now uses a **raw-keyword** approach (no live translation in editor) with **keyboard-driven expansions** for LaTeX commands.

---

## Files Modified

### 1. `src/editor/keyboard.js` — **Complete Rewrite**
**Date:** 2026-09-10  
**Purpose:** All keyboard interactions for the math editor

#### Key Functions Added/Modified:

| Function | Description |
|----------|-------------|
| `insertAtCaret()` | Core insertion utility - inserts text at caret, updates React state |
| `getWordBeforeCaret()` | Returns `{ word, start, end }` for keyword detection (replaces stale closure version) |
| `getCurrentBraceGroup()` | Finds brace group `{...}` containing caret |
| `getAllTopLevelBraceGroups()` | Returns all top-level `{...}` groups for navigation |
| `getBraceGroupIndex()` | Returns index of brace group containing caret |
| `getMultiArgKeywordAtCaret()` | Detects multi-arg keywords (frac, binom, etc.) before caret |
| `getSqrtAtCaret()` | Special detection for `sqrt` → `\sqrt[]{}` |
| `doKeywordExpansion()` | **Fixed:** Replaces keyword (e.g., "frac") with `\frac{}{}` |
| `doSqrtExpansion()` | **Fixed:** Replaces "sqrt" with `\sqrt[]{}` |
| `handleKeyDown()` | Main event handler - all shortcuts |
| `handleCtrlDelete()` | Ctrl+Delete: select → delete math blocks |

#### Fixed Issues:
- ✅ **Keyword duplication**: `frac` + Space → `\frac{}{}` (was `frac\frac{}{}`)
- ✅ **Caret jumping**: Now calculates position from keyword start, not caret
- ✅ **Tab/Enter navigation**: Uses `getAllTopLevelBraceGroups()` for reliable brace indexing
- ✅ **Ctrl+Delete**: Works with direct `textarea.value` reads
- ✅ **Double-Tab exit**: No longer deletes content, only moves caret
- ✅ **Stale closures**: All handlers read `textarea.value` directly

---

### 2. `src/App.jsx` — **Simplified**
**Date:** 2026-09-10  
**Purpose:** Main app component - removed live translation complexity

#### Changes:
- Removed: `displayContent`, `displayCaret`, `rawCaret`, `rawCaretRef`, `noteContentRef`
- Removed: `translateAtBoundary` import and usage
- Removed: Complex diff/reverse-mapping logic in `handleContentChange`
- Simplified: `handleContentChange` → just `setNoteContent(e.target.value)`
- Simplified: `handleSelect` → just updates `isInMathMode`
- Kept: Preview pipeline (`translateAll` → `toLatex` → KaTeX) unchanged

---

### 3. `src/utils/mathTranslator.js` — **Enhanced**
**Date:** 2026-09-10  
**Purpose:** Symbol translation for preview rendering

#### Changes:
- Added `MULTI_ARG_KEYWORDS` export (used by keyboard.js):
  ```js
  export const MULTI_ARG_KEYWORDS = {
    frac: 2, dfrac: 2, tfrac: 2, binom: 2,
    overline: 1, underline: 1, hat: 1, vec: 1, bar: 1, tilde: 1, sqrt: 1
  };
  ```
- Enhanced `tokenize()` to recognize LaTeX commands (`\command`) as `latexcmd` kind
- Updated `translateSegment()` and `reverseSegment()` to preserve `latexcmd` tokens (prevents double-translation of `\sqrt[]{}`)

---

## Final Keyboard Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| **Double-Tab** | Outside math | Insert `\start \end`, caret between |
| **Double-Tab** | Inside math | Jump caret after matching `\end` |
| **Single Tab** | Anywhere | Insert 2 spaces (500ms delay) |
| **Tab** | After `frac`/`binom`/etc. | Expand to `\frac{}{}` |
| **Space** | After `frac`/`binom`/etc. | Expand to `\frac{}{}` |
| **Space** | After `sqrt` | Expand to `\sqrt[]{}` |
| **Enter** | In 1st `{}` of `\frac` | Move to next `{}` |
| **Tab** | In 1st `{}` of `\frac` | Move to next `{}` |
| **Backspace** | At start of 2nd `{}` | Move to end of 1st `{}` |
| **Backspace** | On `{}` (empty) | Delete both braces |
| **Ctrl+U** | Anywhere | Insert `_{}` (subscript) |
| **Ctrl+I** | Anywhere | Insert `^{}` (superscript) |
| **Ctrl+Delete** | Anywhere | Select nearest `\start...\end` block, press again to delete |

---

## Test Cases Verified

| Test | Expected | Status |
|------|----------|--------|
| Type `frac` + Space | `\frac{}{}` with caret in 1st `{}` | ✅ |
| Type `frac` + Tab | `\frac{}{}` with caret in 1st `{}` | ✅ |
| Type `sqrt` + Space | `\sqrt[]{}` with caret in `[]` | ✅ |
| Type `binom` + Space | `\binom{}{}` | ✅ |
| Enter in 1st `{}` of `\frac` | Move to 2nd `{}` | ✅ |
| Tab in 1st `{}` of `\frac` | Move to 2nd `{}` | ✅ |
| Backspace at start of 2nd `{}` | Move to end of 1st `{}` | ✅ |
| Backspace on `{}` | Delete both braces | ✅ |
| Double-Tab (empty editor) | Insert `\start \end` | ✅ |
| Double-Tab (inside math) | Jump after `\end` | ✅ |
| Ctrl+Delete (1st press) | Highlight math block | ✅ |
| Ctrl+Delete (2nd press) | Delete math block | ✅ |
| Ctrl+U | Insert `_{}` | ✅ |
| Ctrl+I | Insert `^{}` | ✅ |
| Preview renders `\frac{a}{b}` | KaTeX fraction | ✅ |
| Preview renders `\sqrt[n]{x}` | KaTeX nth root | ✅ |

---

## Architecture Notes

### Why Raw Keywords in Editor?
- **No translation lag**: Typing is instant, no diff/reverse-mapping
- **Predictable caret**: Caret position = actual text position
- **Source of truth**: Raw content stored, preview derives from it

### Why `textarea.value` Direct Reads?
- React state (`noteContent`) updates asynchronously
- Event handlers capturing `getContent()` callback get stale values
- Direct DOM read = always current

### Brace Navigation Logic
- `getAllTopLevelBraceGroups()` scans once, returns all `{...}` at depth 0
- `getBraceGroupIndex()` finds which group contains caret
- Enter/Tab → `groups[index + 1]`, Backspace → `groups[index - 1]`
- Works for any multi-arg keyword (`frac`, `binom`, `tfrac`, etc.)

---

## Future Considerations

- [ ] Add support for `stackrel`, `overset`, `underset` (3 args)
- [ ] Add `\left` `\right` auto-pairing
- [ ] Consider matrix environments (`pmatrix`, `bmatrix`)
- [ ] Add visual math block indicators in editor (optional)

---

# Walkthrough: Bug Fixes — Caret Preservation & Native Shortcuts

**Date:** 2026-09-11  
**Session:** Fixed two critical typing experience bugs

---

## Summary

Fixed **Bug A (Caret Jump on Translation)** and **Bug B (Ctrl+Del/Ctrl+Backspace Broken)** with comprehensive test coverage (Vitest + Playwright).

---

## Files Modified

### 1. `src/App.jsx` — Caret Position Preservation
**Date:** 2026-09-11  
**Purpose:** Restore caret after React state updates trigger re-render

#### Changes:
- Added `translateAtBoundary` import from `mathTranslator.js` for incremental translation
- Added `mapCaret` import from `caretUtils.js` for caret position mapping
- Added `caretRef` to store target caret position after translation
- Modified `handleContentChange`:
  - Applies `translateAtBoundary(rawValue, caret)` — only translates **completed** keywords (word boundary confirmed)
  - Calculates new caret: `mapCaret(rawValue, translated, caret)`
  - Stores in `caretRef.current` for post-render restoration
- Added `useLayoutEffect` to restore caret synchronously after render:
  ```js
  useLayoutEffect(() => {
    if (caretRef.current !== null && editorRef.current) {
      if (document.activeElement === editorRef.current) {
        editorRef.current.setSelectionRange(caretRef.current, caretRef.current);
      }
      caretRef.current = null;
    }
  }, [noteContent]);
  ```

#### Why This Works:
- `useLayoutEffect` fires **synchronously** after DOM mutations but before paint — no flicker
- `translateAtBoundary` only translates keywords with confirmed delimiters (space, punctuation, `\end`)
- `mapCaret` walks token-by-token through math blocks to compute accurate offset

---

### 2. `src/editor/keyboard.js` — Native Ctrl+Delete/Ctrl+Backspace
**Date:** 2026-09-11  
**Purpose:** Allow browser native word deletion outside math blocks

#### Changes:
- Modified Ctrl+Delete handler to **only intercept inside math blocks**:
  ```js
  if (key === 'Delete' && modifier && !shiftKey) {
    const inMath = isCaretInMathBlock(content, caret);
    if (inMath) {
      event.preventDefault();
      handleCtrlDelete(textarea, content, caret, setContent);
      return;
    }
    // Outside math block: allow native Ctrl+Delete (delete next word)
  }
  ```
- Ctrl+Backspace was already working (handler checks `!modifier`)

#### Behavior:
| Context | Ctrl+Delete | Ctrl+Backspace |
|---------|-------------|----------------|
| **Outside math block** | Native: delete next word | Native: delete previous word |
| **Inside math block** | Custom: select/delete `\start...\end` block | Native: delete previous char |

---

## Test Coverage Added

### Vitest (`src/App.test.jsx`) — 19 Unit Tests
| Category | Tests |
|----------|-------|
| `translateAtBoundary` | 6 (complete/incomplete keywords, word boundaries, multi-keyword, outside blocks) |
| `mapCaret` | 4 (simple translation, start/end, outside blocks) |
| `isCaretInMathBlock` | 4 (inside, before, after, nested) |
| Keyboard Behavior | 2 (Ctrl+Del outside, Ctrl+Del inside math) |
| Integration | 2 (caret preservation, multi-arg expansion) |

### Playwright (`e2e/editor.spec.js`) — 10 E2E Tests
| Category | Tests |
|----------|-------|
| **Bug A: Caret Jump** | 3 (single keyword, multiple keywords, rapid typing) |
| **Bug B: Native Shortcuts** | 4 (Ctrl+Del word delete, Ctrl+Backspace word delete, Ctrl+Del math block select/delete, Backspace inside math) |
| **Integration** | 3 (combined workflow, math mode indicator appear/disappear) |

---

## Test Results

```
✅ Vitest: 19/19 tests passing
✅ Playwright: 10/10 tests passing
```

---

## Commands to Run Tests

```bash
# Unit tests
npm test           # Run once
npm run test:watch # Watch mode

# E2E tests (requires dev server on localhost:5173)
npm run test:e2e      # Headless
npm run test:e2e:ui   # With UI
```

---

## Architecture Notes

### Why `translateAtBoundary` Instead of `translateAll`?
- `translateAll` translates **everything** — breaks incremental typing
- `translateAtBoundary` only translates **completed** tokens (caret past token + delimiter)
- Prevents mid-word translation (typing "int" won't translate "in" → "∈" then leave "t")

### Why `useLayoutEffect` Not `useEffect`?
- `useEffect` fires **after paint** → user sees caret jump to 0 then back (flicker)
- `useLayoutEffect` fires **before paint** → caret restored synchronously, zero flicker

### Why Direct `textarea.value` Reads in keyboard.js?
- React state (`noteContent`) updates asynchronously
- Event handlers capturing `getContent()` callback get **stale values**
- Direct DOM read = always current, no closure issues

---

## Future Considerations

- [ ] Add support for `stackrel`, `overset`, `underset` (3 args)
- [ ] Add `\left` `\right` auto-pairing
- [ ] Consider matrix environments (`pmatrix`, `bmatrix`)
- [ ] Add visual math block indicators in editor (optional)