/**
 * Result type for functional error handling.
 * Represents either a success (Ok) or a failure (Err).
 */

export type Ok<T> = {
  ok: true;
  value: T;
};

export type Err<E> = {
  ok: false;
  error: E;
};

export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({
  ok: true,
  value,
});

export const err = <E = Error>(error: E): Err<E> => ({
  ok: false,
  error,
});

/**
 * Patrón RemoteData para estados asíncronos.
 */
export type RemoteData<T, E = Error> =
  | { type: 'not_asked' }
  | { type: 'loading' }
  | { type: 'success'; data: T }
  | { type: 'failure'; error: E };

export const notAsked = (): RemoteData<never, never> => ({ type: 'not_asked' });
export const loading = (): RemoteData<never, never> => ({ type: 'loading' });
export const success = <T>(data: T): RemoteData<T, never> => ({ type: 'success', data });
export const failure = <E>(error: E): RemoteData<never, E> => ({ type: 'failure', error });

export const isNotAsked = <T, E>(rd: RemoteData<T, E>): rd is { type: 'not_asked' } => rd.type === 'not_asked';
export const isLoading = <T, E>(rd: RemoteData<T, E>): rd is { type: 'loading' } => rd.type === 'loading';
export const isSuccess = <T, E>(rd: RemoteData<T, E>): rd is { type: 'success'; data: T } => rd.type === 'success';
export const isFailure = <T, E>(rd: RemoteData<T, E>): rd is { type: 'failure'; error: E } => rd.type === 'failure';
