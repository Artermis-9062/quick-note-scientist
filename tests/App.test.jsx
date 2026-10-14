import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { emptySnapshot, STORAGE_KEY } from '../src/storage/noteStorage.js';

// Mock only modal browser APIs; storage, rendering, and the hook remain real.
beforeEach(() => {
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

// Seed real localStorage, with purge disabled unless the test explicitly enables it.
function seed(overrides = {}) {
  const snapshot = { ...emptySnapshot(), settings: { autoPurgeDays: 0 }, ...overrides };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}
const note = { id: 'one', title: 'Research', content: 'Original', updatedAt: 100 };
const navigate = name => fireEvent.click(screen.getByRole('link', { name }));
const openNote = () => fireEvent.click(screen.getByRole('heading', { name: 'Research' }));
// Fail every attempted storage write while keeping existing data available for reads.
function failWrites() {
  return vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
}

describe('storage-aware note actions', () => {
  // Success paths demonstrate that complete snapshots survive mounting the app again.
  it('saves, deletes, restores, and reloads using one write per action', () => {
    // The real entry point uses StrictMode; duplicate initialization must remain read-only.
    const first = render(<React.StrictMode><App /></React.StrictMode>);
    navigate(/Create/);
    fireEvent.change(screen.getByPlaceholderText('Note title...'), { target: { value: 'Research' } });
    fireEvent.change(screen.getByPlaceholderText(/Type your notes/), { target: { value: 'Original' } });
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    fireEvent.click(screen.getByRole('button', { name: /Save Note/ }));
    expect(writes).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledTimes(1);
    first.unmount();
    const second = render(<App />);
    openNote();
    expect(screen.getByPlaceholderText(/Type your notes/)).toHaveValue('Original');
    fireEvent.click(screen.getByTitle('Delete this note'));
    expect(writes).toHaveBeenCalledTimes(2);
    navigate(/Deleted/);
    fireEvent.click(screen.getByRole('button', { name: /Restore/ }));
    expect(writes).toHaveBeenCalledTimes(3);
    second.unmount();
    render(<App />);
    openNote();
    expect(screen.getByPlaceholderText(/Type your notes/)).toHaveValue('Original');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).deletedNotes).toEqual([]);
  });

  // Failed saves retain both a new draft and an existing note's edited text.
  it.each([false, true])('preserves editor text and reports no success on failed save (existing=%s)', existing => {
    seed({ notes: existing ? [note] : [] });
    render(<App />);
    if (existing) openNote(); else navigate(/Create/);
    fireEvent.change(screen.getByPlaceholderText(/Type your notes/), { target: { value: 'Unsaved work' } });
    const raw = localStorage.getItem(STORAGE_KEY);
    const writes = failWrites();
    fireEvent.click(screen.getByRole('button', { name: /Save Note/ }));
    expect(screen.getByPlaceholderText(/Type your notes/)).toHaveValue('Unsaved work');
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    expect(window.alert).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    // Retry succeeds and a new draft still becomes only one saved note.
    writes.mockRestore();
    fireEvent.click(screen.getByRole('button', { name: /Save Note/ }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).notes).toHaveLength(1);
  });

  // Deletion cannot navigate away or clear the current editor before the write succeeds.
  it('retains the active editor on failed deletion', () => {
    seed({ notes: [note] });
    render(<App />);
    openNote();
    const writes = failWrites();
    fireEvent.click(screen.getByTitle('Delete this note'));
    expect(writes).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText(/Type your notes/)).toHaveValue('Original');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).notes).toEqual([note]);
  });

  // Every trash-removal action must leave its record visible when persistence fails.
  it.each([/Restore/, /Delete Forever/, /Clear All Trash/])('keeps trash after failed %s', action => {
    seed({ deletedNotes: [{ ...note, deletedAt: 100 }] });
    render(<App />);
    navigate(action.source.includes('Clear') ? /Settings/ : /Deleted/);
    const raw = localStorage.getItem(STORAGE_KEY);
    const writes = failWrites();
    fireEvent.click(screen.getByRole('button', { name: action }));
    expect(writes).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    navigate(/Deleted/);
    expect(screen.getByRole('heading', { name: 'Research' })).toBeInTheDocument();
  });

  // A failed settings write must leave the select showing the persisted value.
  it('does not publish failed settings changes', () => {
    seed();
    render(<App />);
    navigate(/Settings/);
    failWrites();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '7' } });
    expect(screen.getByRole('combobox')).toHaveValue('0');
  });
});

describe('protection mode and purge', () => {
  // Corrupt storage is not overwritten, even through editor or settings interactions.
  it('blocks writes and recovers through a read-only retry', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('blocked');
    navigate(/Create/);
    expect(screen.getByRole('button', { name: /Save Note/ })).toBeDisabled();
    navigate(/Settings/);
    expect(screen.getByRole('combobox')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Retry loading/ }));
    expect(writes).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{broken');
    // Simulate external recovery, then verify retry itself only reads the repaired data.
    seed({ notes: [note] });
    writes.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Retry loading/ }));
    expect(writes).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    navigate(/Home/);
    expect(screen.getByRole('heading', { name: 'Research' })).toBeInTheDocument();
  });

  // Even obtaining the browser storage object can fail; initialization must still render.
  it('handles denied storage access', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('Denied'); });
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
  });

  // Purge failure must preserve the record without looping on its error update.
  it('keeps expired trash when purge fails', async () => {
    seed({ settings: { autoPurgeDays: 1 }, deletedNotes: [{ ...note, deletedAt: 100 }] });
    const writes = failWrites();
    render(<App />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('could not be saved'));
    expect(writes).toHaveBeenCalledTimes(1);
    navigate(/Deleted/);
    expect(screen.getByRole('heading', { name: 'Research' })).toBeInTheDocument();
  });

  // Corruption blocks purge entirely; a valid Never setting is honored on first render.
  it.each(['corrupt', 'never'])('does not purge in %s mode', mode => {
    const snapshot = seed({ deletedNotes: [{ ...note, deletedAt: 100 }] });
    if (mode === 'corrupt') localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...snapshot, version: 2 }));
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    expect(writes).not.toHaveBeenCalled();
  });

  // A successful purge persists before publishing the new trash collection.
  it('persists a successful purge across reload', () => {
    seed({ settings: { autoPurgeDays: 1 }, deletedNotes: [{ ...note, deletedAt: 100 }] });
    const first = render(<App />);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).deletedNotes).toEqual([]);
    first.unmount();
    render(<App />);
    navigate(/Deleted/);
    expect(screen.getByRole('heading', { name: 'Trash is empty' })).toBeInTheDocument();
  });
});
