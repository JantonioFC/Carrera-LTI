import { describe, expect, it } from "vitest";
import { MockTimeProvider } from "../__mocks__/MockTimeProvider";
import { applyPenalty, pruneExpiredFeedback } from "./FeedbackStore";

interface SearchResult {
	id: string;
	score: number;
}
interface FeedbackEntry {
	resultId: string;
	signal: "positive" | "negative";
	createdAt: number;
}

describe("FeedbackStore.applyPenalty", () => {
	it("should_reduce_score_of_negatively_rated_result", () => {
		const results: SearchResult[] = [
			{ id: "doc-1", score: 0.9 },
			{ id: "doc-2", score: 0.8 },
		];
		const feedback: FeedbackEntry[] = [
			{ resultId: "doc-1", signal: "negative", createdAt: Date.now() },
		];
		const penalized = applyPenalty(results, feedback);
		expect(penalized.find((r) => r.id === "doc-1")!.score).toBeLessThan(0.9);
		expect(penalized.find((r) => r.id === "doc-2")!.score).toBe(0.8);
	});

	it("should_boost_score_of_positively_rated_result", () => {
		const results: SearchResult[] = [{ id: "doc-1", score: 0.7 }];
		const feedback: FeedbackEntry[] = [
			{ resultId: "doc-1", signal: "positive", createdAt: Date.now() },
		];
		const boosted = applyPenalty(results, feedback);
		expect(boosted.find((r) => r.id === "doc-1")!.score).toBeGreaterThan(0.7);
	});

	it("should_not_change_score_of_results_without_feedback", () => {
		const results: SearchResult[] = [
			{ id: "doc-1", score: 0.9 },
			{ id: "doc-2", score: 0.8 },
		];
		const penalized = applyPenalty(results, []);
		expect(penalized.find((r) => r.id === "doc-1")!.score).toBe(0.9);
		expect(penalized.find((r) => r.id === "doc-2")!.score).toBe(0.8);
	});

	it("should_clamp_score_between_0_and_1", () => {
		const results: SearchResult[] = [{ id: "doc-1", score: 0.05 }];
		const feedback: FeedbackEntry[] = [
			{ resultId: "doc-1", signal: "negative", createdAt: Date.now() },
			{ resultId: "doc-1", signal: "negative", createdAt: Date.now() },
			{ resultId: "doc-1", signal: "negative", createdAt: Date.now() },
		];
		const penalized = applyPenalty(results, feedback);
		expect(penalized[0].score).toBeGreaterThanOrEqual(0);
	});

	it("should_clamp_score_to_max_1_after_boost", () => {
		const results: SearchResult[] = [{ id: "doc-1", score: 0.99 }];
		const feedback: FeedbackEntry[] = [
			{ resultId: "doc-1", signal: "positive", createdAt: Date.now() },
		];
		const boosted = applyPenalty(results, feedback);
		expect(boosted[0].score).toBeLessThanOrEqual(1);
	});

	it("should_apply_multiple_feedback_signals_cumulatively", () => {
		const results: SearchResult[] = [{ id: "doc-1", score: 0.9 }];
		const feedback: FeedbackEntry[] = [
			{ resultId: "doc-1", signal: "negative", createdAt: Date.now() },
			{ resultId: "doc-1", signal: "negative", createdAt: Date.now() },
		];
		const single: FeedbackEntry[] = [
			{ resultId: "doc-1", signal: "negative", createdAt: Date.now() },
		];
		const double = applyPenalty(results, feedback);
		const once = applyPenalty(results, single);
		expect(double[0].score).toBeLessThan(once[0].score);
	});
});

describe("FeedbackStore.pruneExpiredFeedback", () => {
	it("should_prune_feedback_older_than_retention_days", () => {
		const now = Date.now();
		const time = new MockTimeProvider(now);
		const old: FeedbackEntry[] = [
			{ resultId: "x", signal: "negative", createdAt: now - 91 * 86_400_000 },
		];
		const pruned = pruneExpiredFeedback(old, { retentionDays: 90, time });
		expect(pruned).toHaveLength(0);
	});

	it("should_keep_feedback_within_retention_window", () => {
		const now = Date.now();
		const time = new MockTimeProvider(now);
		const recent: FeedbackEntry[] = [
			{ resultId: "x", signal: "positive", createdAt: now - 30 * 86_400_000 },
		];
		const pruned = pruneExpiredFeedback(recent, { retentionDays: 90, time });
		expect(pruned).toHaveLength(1);
	});

	it("should_handle_empty_feedback_list", () => {
		const time = new MockTimeProvider(Date.now());
		expect(pruneExpiredFeedback([], { retentionDays: 90, time })).toHaveLength(
			0,
		);
	});

	it("should_keep_feedback_exactly_at_boundary", () => {
		const now = Date.now();
		const time = new MockTimeProvider(now);
		const boundary: FeedbackEntry[] = [
			{ resultId: "x", signal: "negative", createdAt: now - 90 * 86_400_000 },
		];
		// exactamente 90 días → debe conservarse (no expirado todavía)
		const pruned = pruneExpiredFeedback(boundary, { retentionDays: 90, time });
		expect(pruned).toHaveLength(1);
	});
});
