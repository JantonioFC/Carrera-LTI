import {
	type ChildProcess,
	type SpawnOptions,
	spawn,
} from "node:child_process";
import { createInterface } from "node:readline";
import type { IPCMessage } from "../../src/cortex/ipc/IPCProtocol";
import { parseIPCMessage } from "../../src/cortex/ipc/IPCProtocol";
import type { SubprocessTransport } from "../../src/cortex/subprocess/SubprocessAdapter";

const DEFAULT_TIMEOUT_MS = 30_000;

type SpawnFn = (
	command: string,
	args: string[],
	options: SpawnOptions,
) => ChildProcess;

export interface StdioTransportOptions {
	timeoutMs?: number;
	spawnFn?: SpawnFn;
}

/**
 * Transport real sobre child_process.spawn() + readline (NDJSON stdio).
 *
 * Implementa SubprocessTransport para usar con SubprocessAdapter.
 * send() escribe un mensaje NDJSON a stdin y espera la respuesta con
 * el mismo id en stdout. Líneas no-NDJSON (banners de arranque) se ignoran.
 * Timeout configurable (default: 30s).
 *
 * Ref: RFC-002 §4.4 Fase C — Issue #52
 */
export class StdioTransport implements SubprocessTransport {
	private readonly proc: ChildProcess;
	private readonly timeoutMs: number;
	private readonly pending = new Map<
		string,
		{ resolve: (msg: IPCMessage) => void; reject: (err: Error) => void }
	>();

	constructor(
		binaryPath: string,
		args: string[] = [],
		opts: StdioTransportOptions = {},
	) {
		this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
		const spawnFn = opts.spawnFn ?? spawn;

		this.proc = spawnFn(binaryPath, args, {
			stdio: ["pipe", "pipe", "inherit"],
		});

		const rl = createInterface({ input: this.proc.stdout! });
		rl.on("line", (line) => {
			try {
				const msg = parseIPCMessage(line);
				const handler = this.pending.get(msg.id);
				if (handler) {
					this.pending.delete(msg.id);
					handler.resolve(msg);
				}
			} catch {
				// Ignorar líneas no-NDJSON (banners de arranque, logs, etc.)
			}
		});
	}

	async onReady(): Promise<void> {
		if (!this.proc.pid) {
			throw new Error("StdioTransport: process failed to start");
		}
	}

	/** Termina el subproceso y rechaza todos los requests pendientes. Issue #61 */
	kill(signal: NodeJS.Signals = "SIGTERM"): void {
		for (const [id, handler] of this.pending) {
			handler.reject(
				new Error(`StdioTransport: killed (${signal}) — id=${id}`),
			);
			this.pending.delete(id);
		}
		this.proc.kill(signal);
	}

	async send(msg: IPCMessage): Promise<IPCMessage> {
		return new Promise<IPCMessage>((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(msg.id);
				reject(
					new Error(
						`StdioTransport: timeout after ${this.timeoutMs}ms for id=${msg.id}`,
					),
				);
			}, this.timeoutMs);

			this.pending.set(msg.id, {
				resolve: (response) => {
					clearTimeout(timer);
					resolve(response);
				},
				reject: (err) => {
					clearTimeout(timer);
					reject(err);
				},
			});

			this.proc.stdin!.write(`${JSON.stringify(msg)}\n`);
		});
	}
}
