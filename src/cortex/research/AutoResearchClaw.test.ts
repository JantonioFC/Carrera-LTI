import { beforeEach, describe, expect, it, vi } from "vitest";
import { AutoResearchClaw } from "./AutoResearchClaw";

function makePaperClient() {
	return {
		search: vi.fn().mockResolvedValue([
			{
				id: "p1",
				title: "TCP Congestion Control",
				abstract: "Estudio sobre control de congestión.",
				url: "https://arxiv.org/p1",
			},
			{
				id: "p2",
				title: "UDP vs TCP Latency",
				abstract: "Comparativa de latencias.",
				url: "https://arxiv.org/p2",
			},
		]),
	};
}

function makeIndexer() {
	return {
		indexDocument: vi.fn().mockResolvedValue({ chunks: 3 }),
	};
}

describe("AutoResearchClaw — búsqueda", () => {
	let client: ReturnType<typeof makePaperClient>;
	let indexer: ReturnType<typeof makeIndexer>;
	let claw: AutoResearchClaw;

	beforeEach(() => {
		client = makePaperClient();
		indexer = makeIndexer();
		claw = new AutoResearchClaw({
			client: client as never,
			indexer: indexer as never,
		});
	});

	it("should_search_papers_and_return_pending_results", async () => {
		const results = await claw.search("TCP congestion control");
		expect(client.search).toHaveBeenCalledWith("TCP congestion control");
		expect(results).toHaveLength(2);
		expect(results.every((r) => r.status === "pending")).toBe(true);
	});

	it("should_include_title_abstract_and_url_in_each_result", async () => {
		const results = await claw.search("TCP");
		expect(results[0].title).toBe("TCP Congestion Control");
		expect(results[0].abstract).toBeDefined();
		expect(results[0].url).toContain("arxiv.org");
	});

	it("should_not_auto_import_anything_without_approval", async () => {
		await claw.search("TCP");
		expect(indexer.indexDocument).not.toHaveBeenCalled();
	});

	it("should_return_empty_array_when_no_results_found", async () => {
		client.search.mockResolvedValueOnce([]);
		const results = await claw.search("tema sin papers");
		expect(results).toHaveLength(0);
	});
});

describe("AutoResearchClaw — aprobación individual (REQ-08)", () => {
	let client: ReturnType<typeof makePaperClient>;
	let indexer: ReturnType<typeof makeIndexer>;
	let claw: AutoResearchClaw;

	beforeEach(() => {
		client = makePaperClient();
		indexer = makeIndexer();
		claw = new AutoResearchClaw({
			client: client as never,
			indexer: indexer as never,
		});
	});

	it("should_index_paper_when_approved", async () => {
		const results = await claw.search("TCP");
		await claw.approve(results[0].id);
		expect(indexer.indexDocument).toHaveBeenCalledWith(
			expect.objectContaining({ docId: results[0].id }),
		);
	});

	it("should_mark_result_as_approved_after_approval", async () => {
		const results = await claw.search("TCP");
		await claw.approve(results[0].id);
		const updated = claw.getPendingResults();
		expect(updated.find((r) => r.id === results[0].id)?.status).toBe(
			"approved",
		);
	});

	it("should_not_index_paper_when_rejected", async () => {
		const results = await claw.search("TCP");
		claw.reject(results[1].id);
		expect(indexer.indexDocument).not.toHaveBeenCalled();
	});

	it("should_mark_result_as_rejected_after_rejection", async () => {
		const results = await claw.search("TCP");
		claw.reject(results[0].id);
		expect(
			claw.getPendingResults().find((r) => r.id === results[0].id)?.status,
		).toBe("rejected");
	});

	it("should_throw_when_approving_unknown_id", async () => {
		await claw.search("TCP");
		await expect(claw.approve("ghost-id")).rejects.toThrow("not found");
	});

	it("should_allow_approving_only_one_result_independently", async () => {
		const results = await claw.search("TCP");
		await claw.approve(results[0].id); // solo el primero
		expect(indexer.indexDocument).toHaveBeenCalledTimes(1);
		const pending = claw.getPendingResults();
		expect(pending.find((r) => r.id === results[1].id)?.status).toBe("pending");
	});
});
