import { useCallback, useState } from 'react';
import { emptySnapshot, loadSnapshot, saveSnapshot } from './noteStorage.js';

/** Convert a read result into UI state without ever persisting the fallback. */
function readState() {
  const result = loadSnapshot();
  return {
    snapshot: result.ok ? result.snapshot : emptySnapshot(),
    blocked: !result.ok,
    error: result.ok ? null : result.error,
  };
}

/** Own persisted state; editor text remains in App so failed writes cannot erase it. */
export function useNoteStorage() {
  // Lazy initialization reads before the first render and avoids a default-settings purge.
  const [state, setState] = useState(readState);
  const { blocked } = state;

  // The callback depends only on protection mode; changing an error does not retry purge.
  const commitSnapshot = useCallback((next) => {
    if (blocked) return false;
    const result = saveSnapshot(undefined, next);
    if (!result.ok) {
      // Keep the same snapshot object: UI data and purge dependencies stay unchanged.
      setState(previous => ({ ...previous, error: result.error }));
      return false;
    }
    // Publish state only after persistence; consumers may now report success or navigate.
    setState(previous => ({ ...previous, snapshot: next, error: null }));
    return true;
  }, [blocked]);

  // A retry is read-only, so repeated failures cannot overwrite recoverable data.
  const retryLoad = () => setState(readState());
  return { ...state, commitSnapshot, retryLoad };
}
