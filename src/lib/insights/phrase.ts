/**
 * LLM phrasing layer: rules decide *when* an insight fires and compute the
 * numbers; Claude turns them into a terse headline + one short action line
 * (PRD: number-first, glanceable, never a paragraph).
 *
 * Guarantees:
 *  - Works with no ANTHROPIC_API_KEY at all (template fallback).
 *  - Never blocks the page for long (hard timeout, then fallback).
 *  - Caches per insight fingerprint, so an unchanged insight never re-calls the API.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Insight } from "./rules";

const MODEL = process.env.OPSHUB_MODEL ?? "claude-sonnet-5";
const TIMEOUT_MS = 4000;

const cache = new Map<string, { headline: string; action: string }>();

export interface PhrasedInsight extends Insight {
  /** True when Claude produced the wording; false = deterministic template. */
  aiPhrased: boolean;
}

export async function phraseInsights(insights: Insight[]): Promise<PhrasedInsight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || insights.length === 0) {
    return insights.map((i) => ({ ...i, aiPhrased: false }));
  }

  const pending = insights.filter((i) => !cache.has(i.fingerprint));
  if (pending.length > 0) {
    try {
      const client = new Anthropic({ apiKey });
      const payload = pending.map((i) => ({
        id: i.fingerprint,
        type: i.type,
        facts: i.facts,
      }));
      const response = await client.messages.create(
        {
          model: MODEL,
          max_tokens: 700,
          system: [
            "You phrase operational alerts for a small Swedish e-commerce merchant's dashboard.",
            "For each alert, return JSON only: an array of {id, headline, action}.",
            "headline: number-first, terse, max 10 words, no trailing period. Lead with the metric.",
            'action: one imperative suggestion, max 8 words, ends with a period. Example: {"id":"x","headline":"Refunds +40% — 6 of 9 on Lavender Serum","action":"Check the latest batch."}',
            "Never invent numbers not present in facts. No markdown, no commentary.",
          ].join(" "),
          messages: [{ role: "user", content: JSON.stringify(payload) }],
        },
        { timeout: TIMEOUT_MS },
      );
      const text = response.content.find((b) => b.type === "text")?.text ?? "[]";
      const parsed: { id: string; headline: string; action: string }[] = JSON.parse(
        text.slice(text.indexOf("["), text.lastIndexOf("]") + 1),
      );
      for (const item of parsed) {
        if (item.id && item.headline && item.action) {
          cache.set(item.id, { headline: item.headline, action: item.action });
        }
      }
    } catch {
      // API hiccup, malformed output, timeout — fall back silently; the
      // template text is always correct because it comes from the rules.
    }
  }

  return insights.map((i) => {
    const phrased = cache.get(i.fingerprint);
    return phrased
      ? { ...i, headline: phrased.headline, action: phrased.action, aiPhrased: true }
      : { ...i, aiPhrased: false };
  });
}
