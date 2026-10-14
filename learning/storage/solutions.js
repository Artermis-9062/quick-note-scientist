import { isValidNote } from '../../src/storage/noteStorage.js';

/** Reference 1: reuse production validation so the exercise matches the app's rules. */
export function validateNote(note, trashed = false) {
  return isValidNote(note, trashed);
}

/** Reference 2: move a copied note; the old arrays and note object stay untouched. */
export function moveNote(snapshot, noteId, destination, now) {
  const toTrash = destination === 'trash';
  const source = toTrash ? snapshot.notes : snapshot.deletedNotes;
  const note = source.find(record => record.id === noteId);
  if (!note) return snapshot;

  // Metadata belongs only to the trash copy, never to the restored active note.
  const moved = { ...note };
  if (toTrash) moved.deletedAt = now;
  else delete moved.deletedAt;

  // Both collections are returned together for a single complete persistence operation.
  return {
    ...snapshot,
    notes: toTrash ? snapshot.notes.filter(record => record.id !== noteId) : [...snapshot.notes, moved],
    deletedNotes: toTrash ? [...snapshot.deletedNotes, moved] : snapshot.deletedNotes.filter(record => record.id !== noteId),
  };
}

/** Reference 3: publish is deliberately unreachable when the save result is failure. */
export function commitAfterSave(next, save, publish) {
  const result = save(next);
  if (!result.ok) return false;
  publish(next);
  return true;
}
