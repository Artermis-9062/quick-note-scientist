# CLAUDE.md

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

The application follows a modern, component-based pattern using React/TypeScript. The architecture is heavily dependent on a centralized state management pattern (e.g., Zustand or React Context) to govern the application's overall state, particularly the currently active view and the selected note.

**Key Architectural Concerns:**

1.  **State Flow:** All major view transitions are managed by dispatching actions to the central store, which dictates which primary component (`AppLayout` renders based on this state).
2.  **Composition:** Components are designed to be highly composable. Core structural elements (`AppLayout`, `SidebarNavigation`) receive state consumers/handlers as props rather than handling their own state, promoting reuse.
3.  **Domain Separation:** Logic is separated into dedicated feature modules (e.g., `src/components/views/`) which consume the global state.

## Development Workflow & Commands

The primary workflow involves developing features against the central state, building out components for the sidebar and main content area, and ensuring the state updates correctly trigger view changes.

- **Build Command:** `npm run build`
- **Linting:** `npm run lint`
- **Testing:**
  - Run all unit tests: `npm test`
  - Run tests for a single component/file: `npm test -- src/components/SidebarNavigation/SidebarNavigation.tsx`

## Project Structure Guidance

- **State:** State logic resides in `src/store/` (e.g., `useAppStateStore.ts`). Changes here cascade to all components.
- **Layout:** The top-level structure is managed in `src/components/AppLayout/AppLayout.tsx`.
- **Navigation:** Navigation logic is encapsulated in `src/components/SidebarNavigation/SidebarNavigation.tsx`.
- **Views:** Specific screen implementations live in `src/components/views/`.

Please leverage these pointers when analyzing the codebase to quickly grasp the intended data flow and component boundaries.
