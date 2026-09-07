import { create } from 'zustand';

// --- Types ---
// ViewType: 'home' | 'editor' | 'settings' | 'details'

// --- Store ---
export const useAppStateStore = create((set, get) => ({
  // Initial State
  activeView: 'home',
  currentNoteId: null,

  // State Setter/Reducer
  setView: (view, noteId) => {
    console.log(`[State Manager] Navigating from ${get().activeView} to ${view}`);

    set({
      activeView: view,
      currentNoteId: noteId
    });

    // In a real application, you might dispatch side effects here:
    // e.g., if (view === 'editor' && noteId) { loadNoteData(noteId); }
  },
}));
