/**
 * Proveedor de tiempo inyectable para tests deterministas.
 *
 * Permite fijar el instante actual en tests sin depender de `Date.now()` real,
 * evitando fallos por condiciones de carrera o diferencias de zona horaria.
 */
export interface TimeProvider {
	now(): number;
	isoString(): string;
}

/** Implementación de TimeProvider con tiempo fijo para tests. */
export class MockTimeProvider implements TimeProvider {
	constructor(private fixedTime: number) {}
	now(): number {
		return this.fixedTime;
	}
	isoString(): string {
		return new Date(this.fixedTime).toISOString();
	}
}
