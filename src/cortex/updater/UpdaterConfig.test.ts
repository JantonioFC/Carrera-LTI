import { beforeEach, describe, expect, it, vi } from "vitest";
import { type UpdateChannel, UpdaterConfig } from "./UpdaterConfig";

function makeUpdaterClient() {
	return {
		setChannel: vi.fn().mockResolvedValue(undefined),
		getChannel: vi.fn().mockReturnValue("stable" as UpdateChannel),
		checkForUpdates: vi.fn().mockResolvedValue({ available: false }),
	};
}

describe("UpdaterConfig — canal por defecto", () => {
	it("should_default_to_stable_channel", () => {
		const client = makeUpdaterClient();
		const config = new UpdaterConfig({ client: client as never });
		expect(config.getChannel()).toBe("stable");
	});
});

describe("UpdaterConfig — opt-in beta", () => {
	let client: ReturnType<typeof makeUpdaterClient>;
	let config: UpdaterConfig;

	beforeEach(() => {
		client = makeUpdaterClient();
		config = new UpdaterConfig({ client: client as never });
	});

	it("should_switch_to_beta_when_opted_in", async () => {
		await config.setChannel("beta");
		expect(client.setChannel).toHaveBeenCalledWith("beta");
	});

	it("should_return_beta_after_opt_in", async () => {
		client.getChannel.mockReturnValue("beta");
		await config.setChannel("beta");
		expect(config.getChannel()).toBe("beta");
	});

	it("should_switch_back_to_stable_when_opting_out", async () => {
		await config.setChannel("beta");
		await config.setChannel("stable");
		expect(client.setChannel).toHaveBeenLastCalledWith("stable");
	});

	it("should_not_call_setChannel_if_already_on_that_channel", async () => {
		// Ya está en stable por defecto
		await config.setChannel("stable");
		expect(client.setChannel).not.toHaveBeenCalled();
	});
});

describe("UpdaterConfig — verificación de updates", () => {
	it("should_check_for_updates_and_return_result", async () => {
		const client = makeUpdaterClient();
		client.checkForUpdates.mockResolvedValueOnce({
			available: true,
			version: "2.1.0",
		});
		const config = new UpdaterConfig({ client: client as never });
		const result = await config.checkForUpdates();
		expect(result.available).toBe(true);
		expect(result.version).toBe("2.1.0");
	});

	it("should_return_not_available_when_up_to_date", async () => {
		const client = makeUpdaterClient();
		const config = new UpdaterConfig({ client: client as never });
		const result = await config.checkForUpdates();
		expect(result.available).toBe(false);
	});
});
