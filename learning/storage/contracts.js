import { describe, expect, it, vi } from 'vitest';

/** Run identical behavior checks against your answers and the separate references. */
export function checkExercises({ validateNote, moveNote, commitAfterSave }) {
  const note = { id: 'one', title: 'Research', content: 'Text', updatedAt: 100 };
  const snapshot = () => ({ version: 1, notes: [{ ...note }], deletedNotes: [], settings: { autoPurgeDays: 0 } });

  describe('exercise 1: validation', () => {
    // A valid active record passes; trash additionally needs its deletion timestamp.
    it('accepts valid active and deleted notes', () => {
      expect(validateNote(note)).toBe(true);
      expect(validateNote({ ...note, deletedAt: 200 }, true)).toBe(true);
    });
    // These invalid inputs catch missing fields and JavaScript's unusual number values.
    it.each([null, {}, { ...note, id: ' ' }, { ...note, title: 1 }, { ...note, content: null }, { ...note, updatedAt: Infinity }])('rejects invalid note %#', invalid => {
      expect(validateNote(invalid)).toBe(false);
    });
    it('rejects trash without a finite deletedAt', () => {
      expect(validateNote(note, true)).toBe(false);
      expect(validateNote({ ...note, deletedAt: NaN }, true)).toBe(false);
    });
  });

  describe('exercise 2: immutable move', () => {
    // Frozen input detects accidental mutation; the restore must remove trash metadata.
    it('deletes and restores without changing the original snapshot', () => {
      const original = snapshot();
      Object.freeze(original.notes[0]);
      Object.freeze(original.notes);
      Object.freeze(original.deletedNotes);
      Object.freeze(original);
      const trashed = moveNote(original, 'one', 'trash', 200);
      expect(original.notes).toEqual([note]);
      expect(trashed.notes).toEqual([]);
      expect(trashed.deletedNotes).toEqual([{ ...note, deletedAt: 200 }]);
      const restored = moveNote(trashed, 'one', 'notes', 300);
      expect(restored.notes).toEqual([note]);
      expect(restored.deletedNotes).toEqual([]);
      expect(trashed.deletedNotes).toEqual([{ ...note, deletedAt: 200 }]);
      expect(restored.settings).toEqual(original.settings);
    });
    // A nonexistent ID must be a no-op rather than inventing or removing records.
    it('returns the original snapshot for a missing note', () => {
      const original = snapshot();
      expect(moveNote(original, 'missing', 'trash', 200)).toBe(original);
    });
  });

  describe('exercise 3: persistence order', () => {
    // Observe call order as well as return values: UI publication must follow save.
    it('publishes only after successful persistence', () => {
      const next = snapshot();
      const order = [];
      const save = vi.fn(() => { order.push('save'); return { ok: true }; });
      const publish = vi.fn(() => order.push('publish'));
      expect(commitAfterSave(next, save, publish)).toBe(true);
      expect(save).toHaveBeenCalledExactlyOnceWith(next);
      expect(publish).toHaveBeenCalledExactlyOnceWith(next);
      expect(order).toEqual(['save', 'publish']);
    });
    // Failed persistence must leave UI state alone, preserving the user's previous data.
    it('never publishes a failed save', () => {
      const next = snapshot();
      const save = vi.fn(() => ({ ok: false, error: 'No space' }));
      const publish = vi.fn();
      expect(commitAfterSave(next, save, publish)).toBe(false);
      expect(save).toHaveBeenCalledExactlyOnceWith(next);
      expect(publish).not.toHaveBeenCalled();
    });
  });
}
