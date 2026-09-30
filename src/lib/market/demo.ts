import type { EarningsItem, NewsItem, Quote } from "./types";
import type { Range } from "@/lib/workspace";
export const companies: Record<string, [string, number, number]> = {
  AAPL: ["Apple Inc.", 227.52, 1.24],
  MSFT: ["Microsoft Corporation", 428.76, 0.83],
  NVDA: ["NVIDIA Corporation", 142.87, 3.42],
  GOOGL: ["Alphabet Inc.", 176.32, -0.64],
  AMZN: ["Amazon.com, Inc.", 213.07, 1.67],
  META: ["Meta Platforms, Inc.", 612.77, 2.13],
  TSLA: ["Tesla, Inc.", 248.5, -2.31],
  AMD: ["Advanced Micro Devices", 164.22, 4.16],
  SPY: ["S&P 500 ETF", 588.24, 0.72],
  QQQ: ["Nasdaq 100 ETF", 512.83, 1.14],
  DIA: ["Dow Jones ETF", 438.12, 0.31],
  IWM: ["Russell 2000 ETF", 224.65, -0.28],
  NFLX: ["Netflix, Inc.", 918.6, 1.05],
  JPM: ["JPMorgan Chase & Co.", 243.18, 0.52],
  PLTR: ["Palantir Technologies", 78.96, 5.28],
  COIN: ["Coinbase Global", 267.53, -3.14],
  V: ["Visa Inc.", 314.18, 0.45],
  COST: ["Costco Wholesale", 956.22, 0.63],
};
export const DEMO_AS_OF = "2025-01-15T21:00:00.000Z";
export function demoQuote(symbol: string, range: Range = "1mo"): Quote {
  const info = companies[symbol];
  if (!info) throw new Error(`No demo data for ${symbol}`);
  const [name, price, changePercent] = info;
  const seed = [...symbol].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const days = { "1d": 1, "1mo": 30, "3mo": 90, "1y": 365, "5y": 1825 }[range];
  const end = new Date(DEMO_AS_OF).getTime();
  const count = range === "1d" ? 78 : 90;
  const previousClose = price / (1 + changePercent / 100);
  const points = Array.from({ length: count }, (_, i) => {
    const progress = i / (count - 1);
    const baseline =
      range === "1d"
        ? previousClose + (price - previousClose) * progress
        : price * (0.88 + 0.12 * progress);
    return {
      time: Math.round(
        (end -
          (1 - progress) * (range === "1d" ? 6.5 * 3600000 : days * 86400000)) /
          1000,
      ),
      close: +(
        baseline +
        price *
          (Math.sin(i * 1.2 + seed) * 0.003 + Math.cos(i * 0.38) * 0.004) *
          Math.sin(progress * Math.PI)
      ).toFixed(2),
    };
  });
  points[points.length - 1].close = price;
  return {
    symbol,
    name,
    price,
    change: price - previousClose,
    changePercent,
    currency: "USD",
    volume: seed * 115321,
    high: price * 1.012,
    low: price * 0.978,
    yearHigh: price * 1.19,
    yearLow: price * 0.64,
    previousClose,
    points,
    asOf: DEMO_AS_OF,
  };
}
export function demoNews(symbol: string): NewsItem[] {
  return [
    `What to watch in ${companies[symbol]?.[0] ?? symbol}'s next earnings report`,
    "Technology leads a broad market rally as investors assess growth",
    "Inside the numbers: margins, cash flow, and the next quarter",
    "The week ahead: economic releases and company results to follow",
    "A closer look at the forces shaping long-term returns",
  ].map((title, i) => ({
    title,
    url: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/news/`,
    publisher: "Illustrative headline",
    publishedAt: new Date(
      new Date(DEMO_AS_OF).getTime() - i * 3600000,
    ).toISOString(),
  }));
}
export function demoEarnings(date: string): EarningsItem[] {
  return ["JPM", "NFLX", "TSLA", "MSFT", "AAPL"].map((symbol, i) => ({
    symbol,
    name: companies[symbol][0],
    date,
    time: i % 2 === 0 ? "Before open" : "After close",
    estimate: ["$4.12", "$4.20", "$0.76", "$3.10", "$2.35"][i],
  }));
}
