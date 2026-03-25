import { EventEmitter } from "node:events";
import { normalize } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	makeObserverHandlers,
	type ObserverHandlersOptions,
} from "./observerHandlers";

/**
 * Simula un ChildProcess: EventEmitter con kill() que emite 'exit' en el
 * siguiente tick (igual que un proceso real que recibe SIGTERM y termina).
 */
function makeProcessMock() {
	const emitter = new EventEmitter();
	const proc = Object.assign(emitter, {
		pid: 12345,
		kill: vi.fn((_signal?: string) => {
			setTimeout(() => emitter.emit("exit", 0, null), 0);
			return true;
		}),
		stdin: null,
		stdout: null,
		stderr: null,
	});
	return proc;
}

const TEST_RECORDINGS_DIR = "/tmp/test-observer-recordings";

function makeOpts(
	spawnFn: ReturnType<typeof vi.fn>,
	existsFn?: (p: string) => boolean,
): ObserverHandlersOptions {
	return {
		spawnFn,
		mkdirFn: vi.fn(),
		existsFn: existsFn ?? (() => false),
		recordingsDir: TEST_RECORDINGS_DIR,
	};
}

describe("observerHandlers", () => {
	let spawnFn: ReturnType<typeof vi.fn>;
	let procMock: ReturnType<typeof makeProcessMock>;

	beforeEach(() => {
		procMock = makeProcessMock();
		spawnFn = vi.fn().mockReturnValue(procMock);
	});

	it("should_toggle_on_spawns_process_and_returns_active_true", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn),
		);

		const result = await handlers.toggle(true);

		expect(spawnFn).toHaveBeenCalledOnce();
		expect(result.active).toBe(true);
		expect(result.wavPath).toBeUndefined();
	});

	it("should_toggle_on_passes_wav_path_to_script", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn),
		);

		await handlers.toggle(true);

		const args = spawnFn.mock.calls[0][1] as string[];
		expect(args[0]).toBe("/scripts/observer_runner.py");
		expect(args[1]).toMatch(/recording_\d+\.wav$/);
		expect(normalize(args[1])).toContain(normalize(TEST_RECORDINGS_DIR));
	});

	it("should_toggle_on_twice_does_not_spawn_second_process", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn),
		);

		await handlers.toggle(true);
		await handlers.toggle(true);

		expect(spawnFn).toHaveBeenCalledOnce();
	});

	it("should_toggle_off_sends_sigterm_and_returns_active_false", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn),
		);

		await handlers.toggle(true);
		const result = await handlers.toggle(false);

		expect(procMock.kill).toHaveBeenCalledWith("SIGTERM");
		expect(result.active).toBe(false);
	});

	it("should_toggle_off_returns_wav_path_when_file_exists", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn, () => true),
		);

		await handlers.toggle(true);
		const result = await handlers.toggle(false);

		expect(result.wavPath).toMatch(/recording_\d+\.wav$/);
	});

	it("should_toggle_off_omits_wav_path_when_file_missing", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn, () => false),
		);

		await handlers.toggle(true);
		const result = await handlers.toggle(false);

		expect(result.wavPath).toBeUndefined();
	});

	it("should_status_returns_inactive_initially", () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn),
		);

		expect(handlers.status().active).toBe(false);
	});

	it("should_status_returns_active_while_process_running", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn),
		);

		await handlers.toggle(true);

		expect(handlers.status().active).toBe(true);
	});

	it("should_toggle_off_when_not_running_returns_active_false", async () => {
		const handlers = makeObserverHandlers(
			"/venv/bin/python",
			"/scripts/observer_runner.py",
			makeOpts(spawnFn),
		);

		const result = await handlers.toggle(false);

		expect(result.active).toBe(false);
		expect(spawnFn).not.toHaveBeenCalled();
	});
});
