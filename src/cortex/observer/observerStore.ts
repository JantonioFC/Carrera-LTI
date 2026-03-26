/**
 * Store de estado del Observer de audio (grabación de clase).
 *
 * Solo persiste `isRunning` en localStorage; los flags de transición
 * y notificación son efímeros y se resetean en cada sesión.
 *
 * Issue #58
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

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

			setRunning: (v) =>
				set((s) => {
					s.isRunning = v;
				}),
			setTransitioning: (v) =>
				set((s) => {
					s.isTransitioning = v;
				}),
			setShowNotification: (v) =>
				set((s) => {
					s.showNotification = v;
				}),

			// reset no persiste — solo para tests
			reset: () => set(() => ({ ...initialState })),
		})),
		{
			name: "cortex-observer-state",
			storage: createJSONStorage(() => localStorage),
			// Solo persiste isRunning — las transiciones y notificaciones son efímeras
			partialize: (state) => ({ isRunning: state.isRunning }),
			// AR-10 (#238): reset isRunning al rehidratar para evitar estado zombi
			// si el proceso Python crasheó sin emitir el evento de parada.
			onRehydrateStorage: () => (state) => {
				if (state) state.isRunning = false;
			},
		},
	),
);
