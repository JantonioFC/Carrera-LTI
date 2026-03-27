import { beforeEach, describe, expect, it, vi } from "vitest";
import { IndexExporter } from "./IndexExporter";

function makeStorage() {
	return {
		upload: vi
			.fn()
			.mockResolvedValue({ url: "https://storage.example/backup.zip" }),
	};
}

describe("IndexExporter", () => {
	let storage: ReturnType<typeof makeStorage>;
	let exporter: IndexExporter;

	beforeEach(() => {
		storage = makeStorage();
		exporter = new IndexExporter({ storage: storage as never });
	});

	it("should_call_upload_with_correct_path_and_uid", async () => {
		const result = await exporter.exportToFirebase({
			uid: "user-123",
			indexPath: "/data/ruvector.db",
		});
		expect(storage.upload).toHaveBeenCalledWith(
			expect.objectContaining({
				uid: "user-123",
				localPath: "/data/ruvector.db",
			}),
		);
		expect(result.url).toContain("https://");
	});

	it("should_include_timestamp_in_backup_name", async () => {
		await exporter.exportToFirebase({
			uid: "user-123",
			indexPath: "/data/ruvector.db",
		});
		const call = storage.upload.mock.calls[0]![0] as Record<string, string>;
		expect(call.remotePath).toMatch(/backup_\d+/);
	});

	it("should_throw_if_storage_upload_fails", async () => {
		storage.upload.mockRejectedValueOnce(new Error("quota exceeded"));
		await expect(
			exporter.exportToFirebase({
				uid: "user-123",
				indexPath: "/data/ruvector.db",
			}),
		).rejects.toThrow("quota exceeded");
	});
});
