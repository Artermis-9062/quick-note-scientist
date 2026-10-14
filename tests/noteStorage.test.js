import { describe, expect, it, vi } from 'vitest';
import { emptySnapshot, loadSnapshot, saveSnapshot, STORAGE_KEY } from '../src/storage/noteStorage.js';

// Fixtures represent real saved records while remaining fresh for each test.
const note = () => ({ id: 'one', title: 'Research', content: 'Equation', updatedAt: 100 });
const snapshot = () => ({ ...emptySnapshot(), notes: [note()] });

// Inject a storage double to observe exactly which keys are read or written.
function storageWith(values = {}) {
  const data = new Map(Object.entries(values));
  return {
    getItem: vi.fn(key => data.get(key) ?? null),
    setItem: vi.fn((key, value) => data.set(key, value)),
  };
}

describe('loading and migration', () => {
  // Empty storage loads defaults without eagerly creating or overwriting keys.
  it('returns fresh defaults without writing', () => {
    const storage = storageWith();
    expect(loadSnapshot(storage)).toEqual({ ok: true, snapshot: emptySnapshot() });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  // Migration uses the old data but leaves the original recovery copies unchanged.
  it('migrates all legacy collections only on a successful save', () => {
    const values = {
      'scientist-notes': JSON.stringify([note()]),
      'scientist-deleted-notes': JSON.stringify([{ ...note(), id: 'two', deletedAt: 200 }]),
      'scientist-settings': JSON.stringify({ autoPurgeDays: 0 }),
    };
    const storage = storageWith(values);
    const loaded = loadSnapshot(storage);
    expect(loaded.ok).toBe(true);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(saveSnapshot(storage, loaded.snapshot).ok).toBe(true);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(loadSnapshot(storage)).toEqual(loaded);
    for (const [key, raw] of Object.entries(values)) expect(storage.getItem(key)).toBe(raw);
  });

  // An authoritative key must not silently fall back to stale legacy notes.
  it.each(['{', 'null', JSON.stringify({ ...snapshot(), version: 2 })])('protects invalid authoritative data: %s', raw => {
    const storage = storageWith({ [STORAGE_KEY]: raw, 'scientist-notes': JSON.stringify([note()]) });
    expect(loadSnapshot(storage).ok).toBe(false);
    expect(storage.getItem).toHaveBeenCalledTimes(1);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  // Each malformed legacy collection blocks migration instead of dropping its data.
  it.each(['scientist-notes', 'scientist-deleted-notes', 'scientist-settings'])('protects corrupt legacy key %s', key => {
    const storage = storageWith({ [key]: '{broken' });
    expect(loadSnapshot(storage).ok).toBe(false);
    expect(storage.getItem(key)).toBe('{broken');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  // Storage reads can throw even before JSON parsing, including browser security denial.
  it('reports inaccessible storage', () => {
    const storage = storageWith();
    storage.getItem.mockImplementation(() => { throw new Error('SecurityError'); });
    expect(loadSnapshot(storage).ok).toBe(false);
  });
});

describe('validation and atomic persistence', () => {
  // Invalid types, missing timestamps, and ambiguous IDs must never replace valid data.
  it.each([
    { ...snapshot(), notes: null },
    { ...snapshot(), notes: [{ ...note(), id: '' }] },
    { ...snapshot(), notes: [{ ...note(), content: 3 }] },
    { ...snapshot(), notes: [{ ...note(), title: null }] },
    { ...snapshot(), notes: [{ ...note(), updatedAt: null }] },
    { ...snapshot(), notes: [note(), note()] },
    { ...snapshot(), deletedNotes: [{ ...note(), deletedAt: 100 }] },
    { ...emptySnapshot(), deletedNotes: [note()] },
    { ...snapshot(), settings: { autoPurgeDays: -1 } },
    { ...snapshot(), settings: { autoPurgeDays: '30' } },
  ])('rejects invalid snapshot %# without writing', invalid => {
    const raw = JSON.stringify(snapshot());
    const storage = storageWith({ [STORAGE_KEY]: raw });
    expect(saveSnapshot(storage, invalid).ok).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    const corrupt = storageWith({ [STORAGE_KEY]: JSON.stringify(invalid) });
    expect(loadSnapshot(corrupt).ok).toBe(false);
  });

  // One write moves the record; throwing before replacement preserves the old bytes.
  it('keeps the original snapshot when a quota failure interrupts a move', () => {
    const original = snapshot();
    const raw = JSON.stringify(original);
    const storage = storageWith({ [STORAGE_KEY]: raw });
    storage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError'); });
    const moved = { ...original, notes: [], deletedNotes: [{ ...note(), deletedAt: 200 }] };
    expect(saveSnapshot(storage, moved).ok).toBe(false);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });
});
