# Understand and implement safe storage

The app works before you complete these exercises. Your practice files are not
imported by the app, and CI runs only production regression tests.

## Follow the real flow

1. [noteStorage.js](../../src/storage/noteStorage.js) reads the authoritative
   `scientist-state` key or legacy keys. It checks the whole snapshot before
   returning it. A malformed record blocks the load; nothing is silently deleted.
2. [useNoteStorage.js](../../src/storage/useNoteStorage.js) owns the persisted UI
   state. A failed initial load creates a protected, empty display, **not** a new
   saved database. Retry only reads; it never resets storage.
3. [App.jsx](../../src/App.jsx) computes a new snapshot from user actions. Deletion
   removes a note from one array and adds its copy to another in the same snapshot.
4. The hook saves before publishing React state. If writing fails, the previous
   snapshot remains visible and the editor text is left alone.

The key invariant is **construct → validate → persist → publish**. Reversing the
last two steps would let the UI claim that data was saved when it was not.
`localStorage.setItem` replaces one key atomically, but two separate calls cannot
form a transaction. This is why all collections share one key.

## Your coding work

Edit only [exercises.js](./exercises.js) to begin. Its valid JavaScript placeholders
are the gaps: replace them with your own code and remove the `void` lines as you
start using their arguments. Preserve the exported function names and signatures.

Run `npm run test:learning` after each edit. Initial failures are expected, and
these tests are excluded from `npm test` and CI. Focus on one exercise at a time:

- `npm run test:learning -- -t 'exercise 1'`
- `npm run test:learning -- -t 'exercise 2'`
- `npm run test:learning -- -t 'exercise 3'`

### Exercise 1: validate a record

Return a boolean. A valid note has a nonblank string `id`, string `title` and
`content`, and a finite numeric `updatedAt`. A trashed note also needs a finite
numeric `deletedAt`. Empty titles and content are allowed; null records are not.

Hint 1: check the container before accessing its fields.
Hint 2: `typeof null` is `'object'`, so check null explicitly.
Hint 3: use `Number.isFinite` rather than coercing numeric strings or accepting NaN.

Compare your work with `isValidNote` in the storage module when tests pass.

### Exercise 2: move without mutating

`destination` is either `'trash'` or `'notes'`; `now` is a finite timestamp.
Return a snapshot with the matching record moved. Add `deletedAt: now` when
trashing; remove it when restoring. Preserve settings and unrelated notes.
For a missing ID, return the original snapshot unchanged.

Hint 1: `find` locates a record, and `filter` creates an array without it.
Hint 2: object spread creates a shallow copy; array spread appends without `push`.
Hint 3: delete `deletedAt` from a **copy**, not from the record in the old snapshot.

Compare your work with App's delete and restore handlers when tests pass.

### Exercise 3: save before publishing

`save(next)` returns `{ ok: true }` or `{ ok: false, error }`. `publish(next)`
represents updating React state. Return false on failure without publishing;
otherwise publish exactly once and return true. The save function handles its own
exceptions, just like the production storage module.

Hint 1: capture the save result before calling anything else.
Hint 2: an early return makes publishing unreachable after failure.
Hint 3: the successful return belongs after `publish(next)`.

Compare your work with `commitSnapshot` in the hook when tests pass.

## Check your understanding

Explain these aloud or in your own notes before opening the reference:

- What happens if storage is full during a delete? Which note remains visible?
- Why must loading never overwrite malformed JSON with empty arrays?
- Why is the saved snapshot authoritative even when legacy keys contain valid notes?
- Why do we keep the same snapshot object after failed purge instead of retrying
  whenever the error message changes?
- What would two tabs editing the same snapshot require beyond this design?

[solutions.js](./solutions.js) contains separate worked examples. Its validation
example delegates to the real production validator; read that function for the
complete expression. `npm run test:learning:solutions` checks references using the
same tests as your answers.

## Verify the application

Run `npm test`, `npm run lint`, and `npm run build`. Regression tests include
migration, corruption, blocked writes, failed saves and moves, settings, purge,
and remounting the app to check persistence.

For a manual failure check, use a **temporary browser profile** with disposable
notes: set `scientist-state` to malformed JSON in browser developer tools, reload,
and confirm the error and disabled Save/settings controls. Retry must leave that
value unchanged. Restore the original value and retry to load it. Do not run this
exercise against your only copy of important notes.

This change retains old keys as recovery copies and does not autosave editor drafts
or resolve simultaneous writes from multiple tabs.
