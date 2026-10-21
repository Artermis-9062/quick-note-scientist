/** Exercise 1: return true only for a complete, valid note. No storage changes. */
export function validateNote(note, trashed = false) {
  if (note === null || typeof note !== 'object') {
    return false;
  }

  const hasValidId = typeof note.id === 'string' && note.id.trim().length > 0;
  const hasValidTitle = typeof note.title === 'string';
  const hasValidContent = typeof note.content === 'string';
  const hasValidUpdatedAt = Number.isFinite(note.updatedAt);

  if (!hasValidId || !hasValidTitle || !hasValidContent || !hasValidUpdatedAt) {
    return false;
  }

  if (trashed && !Number.isFinite(note.deletedAt)) {
    return false;
  }

  return true;
}

/** Exercise 2: return a new snapshot with one note moved, without mutating the input. */
export function moveNote(snapshot, noteId, destination, now) {
  // TODO: Choose the source collection from destination ('trash' or 'notes').
  // TODO: Find the note; return the original snapshot if it does not exist.
  // TODO: Copy the record, add/remove deletedAt, and construct both new collections.
  void noteId;
  void destination;
  void now;
  return snapshot; // GAP: replace with the immutable next snapshot.
}

/** Exercise 3: return success only after save(next) succeeds, then publish UI state. */
export function commitAfterSave(next, save, publish) {
  // TODO: Call save(next), which returns { ok: true } or { ok: false, error }.
  // TODO: Stop on failure; call publish(next) exactly once on success.
  void next;
  void save;
  void publish;
  return false; // GAP: replace with your save-before-publish flow.
}
