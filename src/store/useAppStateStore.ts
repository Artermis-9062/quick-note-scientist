import { create } from 'zustand';

// --- Types ---
export type ViewType = 'home' | 'editor' | 'settings' | 'details';

interface AppState {
  activeView: ViewType;
  currentNoteId: string | null;
  setView: (view: ViewType, noteId: string | null) => void;
}

// --- Store ---
export const useAppStateStore = create<AppState>((set, get) => ({
  // Initial State
  activeView: 'home',
  currentNoteId: null,

  // State Setter/Reducer
  setView: (view: ViewType, noteId: string | null) => {
    console.log(\`[State Manager] Navigating from \${get().activeView} to \${view}\`);

    set({
      activeView: view,
      currentNoteId: noteId
    });

    // In a real application, you might dispatch side effects here:
    // e.g., if (view === 'editor' && noteId) { loadNoteData(noteId); }
  },
}));