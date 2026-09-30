import { demoEarnings, demoNews, demoQuote, DEMO_AS_OF } from "./demo";
import { nasdaqEarnings, yahooNews, yahooProvider } from "./providers";
import type { DataEnvelope, EarningsItem, NewsItem, Quote } from "./types";
import type { Range } from "@/lib/workspace";

// Bounded process-local cache, with in-flight request coalescing. No paid services.
const cache = new Map<string, { expires: number; value: Promise<unknown> }>();
export function clearCache() {
  cache.clear();
}
async function cached<T>(
  key: string,
  ttl: number,
  operation: () => Promise<T>,
): Promise<T> {
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now())
    return existing.value as Promise<T>;
  if (cache.size >= 500) cache.delete(cache.keys().next().value!);
  const value = operation().catch((error) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { expires: Date.now() + ttl, value });
  return value;
}
async function withFallback<T>(
  key: string,
  mode: string,
  provider: string,
  live: () => Promise<T>,
  demo: () => T,
): Promise<DataEnvelope<T>> {
  const demoMode = mode === "demo" || process.env.MARKET_DATA_MODE === "demo";
  return cached(`${key}:${demoMode ? "demo" : "auto"}`, 300_000, async () => {
    if (!demoMode) {
      try {
        return {
          data: await live(),
          source: { provider, demo: false, asOf: new Date().toISOString() },
        };
      } catch {
        /* Explicitly labeled fallback below. */
      }
    }
    return {
      data: demo(),
      source: {
        provider: "Demo",
        demo: true,
        asOf: DEMO_AS_OF,
        message: demoMode
          ? "Illustrative data, not current market prices or events."
          : `${provider} is unavailable. Showing illustrative demo data, not current market information.`,
      },
    };
  });
}
export function getQuote(
  symbol: string,
  range: Range,
  mode: string,
): Promise<DataEnvelope<Quote>> {
  return withFallback(
    `quote:${symbol}:${range}`,
    mode,
    yahooProvider.id,
    () => yahooProvider.quote(symbol, range),
    () => demoQuote(symbol, range),
  );
}
export function getNews(
  symbol: string,
  mode: string,
): Promise<DataEnvelope<NewsItem[]>> {
  return withFallback(
    `news:${symbol}`,
    mode,
    "Yahoo Finance RSS",
    () => yahooNews(symbol),
    () => demoNews(symbol),
  );
}
export function getEarnings(
  date: string,
  mode: string,
): Promise<DataEnvelope<EarningsItem[]>> {
  return withFallback(
    `earnings:${date}`,
    mode,
    "Nasdaq calendar",
    () => nasdaqEarnings(date),
    () => demoEarnings(date),
  );
}
