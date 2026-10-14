// One versioned key makes moving a note between notes and trash a single write.
export const STORAGE_KEY = 'scientist-state';
export const PURGE_DAYS = [0, 1, 7, 14, 30, 60, 90];

/** Return a fresh default snapshot; callers can never mutate shared arrays. */
export function emptySnapshot() {
  return { version: 1, notes: [], deletedNotes: [], settings: { autoPurgeDays: 30 } };
}

/** Check note fields before rendering or deleting anything from saved data. */
export function isValidNote(note, trashed = false) {
  return note !== null && typeof note === 'object' &&
    typeof note.id === 'string' && note.id.trim().length > 0 &&
    typeof note.title === 'string' && typeof note.content === 'string' &&
    Number.isFinite(note.updatedAt) &&
    (!trashed || Number.isFinite(note.deletedAt));
}

/** Validate the entire snapshot; one bad record protects all original data. */
export function isValidSnapshot(snapshot) {
  // Validate containers first so array operations cannot throw on malformed data.
  if (!snapshot || snapshot.version !== 1 ||
      !Array.isArray(snapshot.notes) || !Array.isArray(snapshot.deletedNotes) ||
      !snapshot.settings || !PURGE_DAYS.includes(snapshot.settings.autoPurgeDays)) return false;

  // IDs must be unique even across trash and active notes to prevent ambiguous moves.
  const allNotes = [...snapshot.notes, ...snapshot.deletedNotes];
  return snapshot.notes.every(note => isValidNote(note)) &&
    snapshot.deletedNotes.every(note => isValidNote(note, true)) &&
    new Set(allNotes.map(note => note.id)).size === allNotes.length;
}

/** Read without writing. Inject storage in tests; browser access also stays in try. */
export function loadSnapshot(storage) {
  try {
    const source = storage ?? window.localStorage;
    const saved = source.getItem(STORAGE_KEY);
    let snapshot;

    // A present new key is authoritative, including corrupt or future versions.
    if (saved !== null) {
      snapshot = JSON.parse(saved);
    } else {
      // Read legacy keys independently; missing keys alone receive defaults.
      const readLegacy = (key, fallback) => {
        const raw = source.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      };
      snapshot = {
        ...emptySnapshot(),
        notes: readLegacy('scientist-notes', []),
        deletedNotes: readLegacy('scientist-deleted-notes', []),
        settings: readLegacy('scientist-settings', { autoPurgeDays: 30 }),
      };
    }

    // Never silently discard malformed records or replace their original bytes.
    if (!isValidSnapshot(snapshot)) throw new Error('Invalid or unsupported saved data.');
    return { ok: true, snapshot };
  } catch {
    return { ok: false, error: 'Saved data could not be loaded. Saving and deletion are blocked to protect it. Fix storage access or recover the saved data, then retry.' };
  }
}

/** Persist exactly once; localStorage leaves the old value intact if setItem fails. */
export function saveSnapshot(storage, snapshot) {
  try {
    // Validate before serialization so bad application data cannot replace good data.
    if (!isValidSnapshot(snapshot)) throw new Error('Invalid snapshot.');
    const target = storage ?? window.localStorage;
    target.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Changes could not be saved. Your previous saved data is unchanged. Check storage access or available space and try again.' };
  }
}
