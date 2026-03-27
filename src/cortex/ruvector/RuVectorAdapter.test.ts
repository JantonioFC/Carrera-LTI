import { beforeEach, describe, expect, it, vi } from "vitest";
import { RuVectorAdapter } from "./RuVectorAdapter";

function makeMockSubprocess() {
	return {
		request: vi.fn(),
	};
}

describe("RuVectorAdapter — indexDocument", () => {
	let sub: ReturnType<typeof makeMockSubprocess>;
	let rv: RuVectorAdapter;

	beforeEach(() => {
		sub = makeMockSubprocess();
		rv = new RuVectorAdapter({ subprocess: sub as never });
	});

	it("should_index_document_and_return_chunk_count", async () => {
		sub.request.mockResolvedValueOnce({
			id: "r1",
			status: "ok",
			data: { chunks: 8 },
		});
		const result = await rv.indexDocument({
			docId: "doc-1",
			path: "/notes/tcp.md",
			mimeType: "text/markdown",
		});
		expect(result.chunks).toBe(8);
		expect(sub.request).toHaveBeenCalledWith(
			expect.objectContaining({ action: "index_document" }),
			undefined,
		);
	});

	it("should_throw_if_subprocess_returns_error", async () => {
		sub.request.mockRejectedValueOnce(new Error("disk full"));
		await expect(
			rv.indexDocument({
				docId: "doc-1",
				path: "/notes/tcp.md",
				mimeType: "text/markdown",
			}),
		).rejects.toThrow("disk full");
	});
});

describe("RuVectorAdapter — query", () => {
	let sub: ReturnType<typeof makeMockSubprocess>;
	let rv: RuVectorAdapter;

	beforeEach(() => {
		sub = makeMockSubprocess();
		rv = new RuVectorAdapter({ subprocess: sub as never });
	});

	it("should_return_ranked_chunks_for_query", async () => {
		sub.request.mockResolvedValueOnce({
			id: "r2",
			status: "ok",
			data: {
				results: [
					{
						chunkId: "c1",
						score: 0.95,
						content: "El three-way handshake...",
						docId: "doc-1",
					},
					{
						chunkId: "c2",
						score: 0.8,
						content: "SYN-ACK es el segundo paso...",
						docId: "doc-1",
					},
				],
			},
		});
		const result = await rv.query({
			text: "qué es el three-way handshake",
			topK: 2,
		});
		expect(result).toHaveLength(2);
		expect(result[0]!.score).toBeGreaterThan(result[1]!.score);
	});

	it("should_return_empty_array_when_index_is_empty", async () => {
		sub.request.mockResolvedValueOnce({
			id: "r3",
			status: "ok",
			data: { results: [] },
		});
		const result = await rv.query({ text: "anything", topK: 5 });
		expect(result).toHaveLength(0);
	});

	it("should_pass_topK_to_subprocess", async () => {
		sub.request.mockResolvedValueOnce({
			id: "r4",
			status: "ok",
			data: { results: [] },
		});
		await rv.query({ text: "query", topK: 10 });
		expect(sub.request).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({ topK: 10 }),
			}),
			undefined,
		);
	});
});

describe("RuVectorAdapter — deleteDocument", () => {
	it("should_delete_document_from_index", async () => {
		const sub = makeMockSubprocess();
		sub.request.mockResolvedValueOnce({ id: "r5", status: "ok", data: {} });
		const rv = new RuVectorAdapter({ subprocess: sub as never });
		await expect(rv.deleteDocument({ docId: "doc-1" })).resolves.not.toThrow();
		expect(sub.request).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "delete_document",
				payload: { docId: "doc-1" },
			}),
			undefined,
		);
	});

	it("should_handle_not_found_gracefully", async () => {
		const sub = makeMockSubprocess();
		sub.request.mockResolvedValueOnce({
			id: "r6",
			status: "ok",
			data: { notFound: true },
		});
		const rv = new RuVectorAdapter({ subprocess: sub as never });
		await expect(rv.deleteDocument({ docId: "ghost" })).resolves.not.toThrow();
	});
});
