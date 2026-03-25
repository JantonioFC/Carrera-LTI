import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useObserverStore } from "../cortex/observer/observerStore";

function resetStore() {
	useObserverStore.getState().reset();
}

describe("observerStore — estado inicial", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("isRunning inicial es false", () => {
		expect(useObserverStore.getState().isRunning).toBe(false);
	});

	it("isTransitioning inicial es false", () => {
		expect(useObserverStore.getState().isTransitioning).toBe(false);
	});

	it("showNotification inicial es false", () => {
		expect(useObserverStore.getState().showNotification).toBe(false);
	});
});

describe("observerStore — setRunning (toggle de estado)", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setRunning(true) activa isRunning", () => {
		useObserverStore.getState().setRunning(true);
		expect(useObserverStore.getState().isRunning).toBe(true);
	});

	it("setRunning(false) desactiva isRunning", () => {
		useObserverStore.getState().setRunning(true);
		useObserverStore.getState().setRunning(false);
		expect(useObserverStore.getState().isRunning).toBe(false);
	});

	it("setRunning no afecta a isTransitioning ni showNotification", () => {
		useObserverStore.getState().setRunning(true);
		expect(useObserverStore.getState().isTransitioning).toBe(false);
		expect(useObserverStore.getState().showNotification).toBe(false);
	});
});

describe("observerStore — setTransitioning", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setTransitioning(true) activa el flag", () => {
		useObserverStore.getState().setTransitioning(true);
		expect(useObserverStore.getState().isTransitioning).toBe(true);
	});

	it("setTransitioning(false) desactiva el flag", () => {
		useObserverStore.getState().setTransitioning(true);
		useObserverStore.getState().setTransitioning(false);
		expect(useObserverStore.getState().isTransitioning).toBe(false);
	});

	it("setTransitioning no afecta a isRunning ni showNotification", () => {
		useObserverStore.getState().setRunning(true);
		useObserverStore.getState().setTransitioning(true);
		expect(useObserverStore.getState().isRunning).toBe(true);
		expect(useObserverStore.getState().showNotification).toBe(false);
	});
});

describe("observerStore — setShowNotification", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("setShowNotification(true) muestra la notificación", () => {
		useObserverStore.getState().setShowNotification(true);
		expect(useObserverStore.getState().showNotification).toBe(true);
	});

	it("setShowNotification(false) oculta la notificación", () => {
		useObserverStore.getState().setShowNotification(true);
		useObserverStore.getState().setShowNotification(false);
		expect(useObserverStore.getState().showNotification).toBe(false);
	});

	it("setShowNotification no afecta a isRunning ni isTransitioning", () => {
		useObserverStore.getState().setShowNotification(true);
		expect(useObserverStore.getState().isRunning).toBe(false);
		expect(useObserverStore.getState().isTransitioning).toBe(false);
	});
});

describe("observerStore — transiciones válidas", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("transición inicio: idle → transitioning → running", () => {
		// Estado inicial: todo false
		expect(useObserverStore.getState().isRunning).toBe(false);
		expect(useObserverStore.getState().isTransitioning).toBe(false);

		// Marcar transición en curso
		useObserverStore.getState().setTransitioning(true);
		expect(useObserverStore.getState().isTransitioning).toBe(true);
		expect(useObserverStore.getState().isRunning).toBe(false);

		// Completar transición: activo y sin transitioning
		useObserverStore.getState().setRunning(true);
		useObserverStore.getState().setTransitioning(false);
		expect(useObserverStore.getState().isRunning).toBe(true);
		expect(useObserverStore.getState().isTransitioning).toBe(false);
	});

	it("transición parada: running → transitioning → idle", () => {
		// Partir de estado running
		useObserverStore.getState().setRunning(true);

		// Iniciar parada
		useObserverStore.getState().setTransitioning(true);
		expect(useObserverStore.getState().isRunning).toBe(true);
		expect(useObserverStore.getState().isTransitioning).toBe(true);

		// Completar parada
		useObserverStore.getState().setRunning(false);
		useObserverStore.getState().setTransitioning(false);
		expect(useObserverStore.getState().isRunning).toBe(false);
		expect(useObserverStore.getState().isTransitioning).toBe(false);
	});

	it("notificación se muestra tras iniciar running", () => {
		useObserverStore.getState().setRunning(true);
		useObserverStore.getState().setShowNotification(true);
		expect(useObserverStore.getState().showNotification).toBe(true);
		expect(useObserverStore.getState().isRunning).toBe(true);
	});

	it("notificación se descarta independientemente de isRunning", () => {
		useObserverStore.getState().setRunning(true);
		useObserverStore.getState().setShowNotification(true);
		useObserverStore.getState().setShowNotification(false);
		// isRunning no debe cambiar al descartar la notificación
		expect(useObserverStore.getState().isRunning).toBe(true);
		expect(useObserverStore.getState().showNotification).toBe(false);
	});
});

describe("observerStore — reset", () => {
	beforeEach(resetStore);
	afterEach(resetStore);

	it("reset devuelve todos los campos al estado inicial", () => {
		useObserverStore.getState().setRunning(true);
		useObserverStore.getState().setTransitioning(true);
		useObserverStore.getState().setShowNotification(true);

		useObserverStore.getState().reset();

		const s = useObserverStore.getState();
		expect(s.isRunning).toBe(false);
		expect(s.isTransitioning).toBe(false);
		expect(s.showNotification).toBe(false);
	});

	it("reset desde estado parcialmente modificado", () => {
		useObserverStore.getState().setRunning(true);

		useObserverStore.getState().reset();

		expect(useObserverStore.getState().isRunning).toBe(false);
	});
});
