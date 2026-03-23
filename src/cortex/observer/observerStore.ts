import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ObserverState {
  isRunning: boolean;
  isTransitioning: boolean;
  showNotification: boolean;
}

interface ObserverActions {
  setRunning: (v: boolean) => void;
  setTransitioning: (v: boolean) => void;
  setShowNotification: (v: boolean) => void;
  reset: () => void;
}

const initialState: ObserverState = {
  isRunning: false,
  isTransitioning: false,
  showNotification: false,
};

export const useObserverStore = create<ObserverState & ObserverActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      setRunning: (v) => set((s) => { s.isRunning = v; }),
      setTransitioning: (v) => set((s) => { s.isTransitioning = v; }),
      setShowNotification: (v) => set((s) => { s.showNotification = v; }),

      // reset no persiste — solo para tests
      reset: () => set(() => ({ ...initialState })),
    })),
    {
      name: 'cortex-observer-state',
      storage: createJSONStorage(() => localStorage),
      // Solo persiste isRunning — las transiciones y notificaciones son efímeras
      partialize: (state) => ({ isRunning: state.isRunning }),
    },
  ),
);
