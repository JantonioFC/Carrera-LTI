import type { ChildProcess } from "node:child_process";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import type { IPCMessage } from "../ipc/IPCProtocol";
import { StdioTransport } from "./StdioTransport";

/**
 * Tests unitarios de StdioTransport.
 *
 * Se inyecta un spawnFn mock que devuelve un proceso falso con
 * PassThrough streams en lugar de un child_process real.
 *
 * Ref: Issue #52 — Fase C
 */

function makeProcessMock(pid?: number) {
	const stdin = new PassThrough();
	const stdout = new PassThrough();
	const stdinLines: string[] = [];

	stdin.on("data", (chunk: Buffer) => {
		for (const line of chunk.toString().split("\n").filter(Boolean)) {
			stdinLines.push(line);
		}
	});

	const proc = {
		pid,
		stdin,
		stdout,
		kill: vi.fn(),
	} as unknown as ChildProcess;

	return {
		proc,
		stdinLines,
		respond(msg: IPCMessage) {
			stdout.push(`${JSON.stringify(msg)}\n`);
		},
		closeStdout() {
			stdout.push(null);
		},
	};
}

describe("StdioTransport", () => {
	it("send_escribe_ndjson_en_stdin", async () => {
		const mock = makeProcessMock();
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
		});
		const msg: IPCMessage = { id: "t-1", status: "ok", data: {} };

		setTimeout(() => mock.respond({ id: "t-1", status: "ok" }), 5);
		await transport.send(msg);

		expect(mock.stdinLines).toHaveLength(1);
		expect(JSON.parse(mock.stdinLines[0])).toMatchObject({ id: "t-1" });
	});

	it("send_resuelve_con_respuesta_coincidente", async () => {
		const mock = makeProcessMock();
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
		});
		const msg: IPCMessage = { id: "r-1", status: "ok" };

		setTimeout(
			() => mock.respond({ id: "r-1", status: "ok", data: { chunks: 7 } }),
			5,
		);
		const result = await transport.send(msg);

		expect(result.id).toBe("r-1");
		expect((result.data as Record<string, number>).chunks).toBe(7);
	});

	it("send_rechaza_por_timeout", async () => {
		const mock = makeProcessMock();
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
			timeoutMs: 20,
		});
		const msg: IPCMessage = { id: "to-1", status: "ok" };

		// No se responde → debe vencer el timeout
		await expect(transport.send(msg)).rejects.toThrow(/timeout/i);
	});

	it("onReady_resuelve_cuando_hay_pid", async () => {
		const mock = makeProcessMock(9001);
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
		});
		await expect(transport.onReady()).resolves.toBeUndefined();
	});

	it("onReady_rechaza_si_no_hay_pid", async () => {
		const mock = makeProcessMock(undefined);
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
		});
		await expect(transport.onReady()).rejects.toThrow(/failed to start/i);
	});

	it("kill_rechaza_pendientes_SIGTERM", async () => {
		const mock = makeProcessMock();
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
		});
		const msg: IPCMessage = { id: "k-1", status: "ok" };

		const sendPromise = transport.send(msg);
		transport.kill("SIGTERM");

		await expect(sendPromise).rejects.toThrow(/killed.*SIGTERM/i);
	});

	it("kill_rechaza_pendientes_SIGKILL", async () => {
		const mock = makeProcessMock();
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
		});
		const msg: IPCMessage = { id: "k-2", status: "ok" };

		const sendPromise = transport.send(msg);
		transport.kill("SIGKILL");

		await expect(sendPromise).rejects.toThrow(/killed.*SIGKILL/i);
	});

	it("stdout_close_rechaza_pendientes", async () => {
		const mock = makeProcessMock();
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
		});
		const msg: IPCMessage = { id: "c-1", status: "ok" };

		const sendPromise = transport.send(msg);
		mock.closeStdout();

		await expect(sendPromise).rejects.toThrow(/stdout closed/i);
	});

	it("respuestas_progress_no_resuelven_la_promesa", async () => {
		const mock = makeProcessMock();
		const transport = new StdioTransport("/bin/ruvector", [], {
			spawnFn: vi.fn().mockReturnValue(mock.proc),
			timeoutMs: 50,
		});
		const msg: IPCMessage = { id: "p-1", status: "ok" };

		const sendPromise = transport.send(msg);
		// Respuesta progress con mismo id — debe ser ignorada (RFC-001)
		mock.respond({ id: "p-1", status: "progress" });

		await expect(sendPromise).rejects.toThrow(/timeout/i);
	});
});
