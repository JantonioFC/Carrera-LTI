/**
 * Re-exporta SubprocessAdapter desde su nueva ubicación canónica.
 * Movido a electron/subprocess/ en Issue #89.
 * Este shim mantiene compatibilidad con importadores del lado renderer
 * (e.g. RuVectorAdapter) sin romper el árbol de imports.
 */
export type {
	AdapterRequest,
	RequestOptions,
	SubprocessTransport,
} from "../../../electron/subprocess/SubprocessAdapter";
export { SubprocessAdapter } from "../../../electron/subprocess/SubprocessAdapter";
