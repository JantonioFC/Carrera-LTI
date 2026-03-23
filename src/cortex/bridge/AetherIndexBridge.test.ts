import { beforeEach, describe, expect, it, vi } from "vitest";
import { AetherIndexBridge } from "./AetherIndexBridge";

interface MockIndexer {
	indexDocument: ReturnType<typeof vi.fn>;
	deleteDocument: ReturnType<typeof vi.fn>;
}

function makeIndexer(): MockIndexer {
	return {
		indexDocument: vi.fn().mockResolvedValue({ chunks: 5, status: "ok" }),
		deleteDocument: vi.fn().mockResolvedValue({ status: "ok" }),
	};
}

describe("AetherIndexBridge.onDocumentSaved", () => {
	let indexer: MockIndexer;
	let bridge: AetherIndexBridge;

	beforeEach(() => {
		indexer = makeIndexer();
		bridge = new AetherIndexBridge({ indexer: indexer as never });
	});

	it("should_call_indexDocument_when_document_is_saved", async () => {
		const event = {
			type: "saved",
			docId: "doc-1",
			path: "/aether/doc-1.md",
			mimeType: "text/markdown",
		};
		await bridge.onDocumentSaved(event);
		expect(indexer.indexDocument).toHaveBeenCalledWith({
			docId: "doc-1",
			path: "/aether/doc-1.md",
			mimeType: "text/markdown",
		});
	});

	it("should_return_indexing_result_on_success", async () => {
		const event = {
			type: "saved",
			docId: "doc-1",
			path: "/aether/doc-1.md",
			mimeType: "text/markdown",
		};
		const result = await bridge.onDocumentSaved(event);
		expect(result.status).toBe("ok");
		expect(result.chunks).toBe(5);
	});

	it("should_not_index_if_event_type_is_not_saved", async () => {
		const event = {
			type: "opened",
			docId: "doc-1",
			path: "/aether/doc-1.md",
			mimeType: "text/markdown",
		};
		await bridge.onDocumentSaved(event);
		expect(indexer.indexDocument).not.toHaveBeenCalled();
	});

	it("should_propagate_indexer_errors", async () => {
		indexer.indexDocument.mockRejectedValueOnce(new Error("RuVector timeout"));
		const event = {
			type: "saved",
			docId: "doc-x",
			path: "/aether/doc-x.md",
			mimeType: "text/markdown",
		};
		await expect(bridge.onDocumentSaved(event)).rejects.toThrow(
			"RuVector timeout",
		);
	});
});

describe("AetherIndexBridge.onDocumentDeleted", () => {
	let indexer: MockIndexer;
	let bridge: AetherIndexBridge;

	beforeEach(() => {
		indexer = makeIndexer();
		bridge = new AetherIndexBridge({ indexer: indexer as never });
	});

	it("should_call_deleteDocument_when_document_is_deleted", async () => {
		await bridge.onDocumentDeleted({ docId: "doc-1" });
		expect(indexer.deleteDocument).toHaveBeenCalledWith({ docId: "doc-1" });
	});

	it("should_not_throw_if_document_was_not_indexed", async () => {
		indexer.deleteDocument.mockResolvedValueOnce({ status: "not_found" });
		await expect(
			bridge.onDocumentDeleted({ docId: "phantom" }),
		).resolves.not.toThrow();
	});
});
