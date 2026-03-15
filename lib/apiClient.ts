import * as finnhub from "./finnhub";
import { getCacheKey, getCached, setCache, CACHE_TTL } from "./cache";

type RequestQueue = Map<string, Promise<unknown>>;

// Global request queue to prevent duplicate simultaneous requests
const requestQueue: RequestQueue = new Map();

async function queuedRequest<T>(
  cacheKey: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if request is already in flight
  const existingRequest = requestQueue.get(cacheKey);
  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  // Start new request
  const request = requestFn()
    .then((result) => {
      requestQueue.delete(cacheKey);
      return result;
    })
    .catch((error) => {
      requestQueue.delete(cacheKey);
      throw error;
    });

  requestQueue.set(cacheKey, request);
  return request;
}

export type ApiClientOptions = {
  apiKey: string;
  onRateLimit?: (retryAfter: number) => void;
};

// Global rate limit handler
let globalRateLimitHandler: ((retryAfter: number) => void) | undefined;

export function setGlobalRateLimitHandler(handler: (retryAfter: number) => void) {
  globalRateLimitHandler = handler;
}

export class ApiClient {
  private apiKey: string;
  private onRateLimit?: (retryAfter: number) => void;

  constructor(options: ApiClientOptions) {
    this.apiKey = options.apiKey;
    this.onRateLimit = options.onRateLimit;
  }

  private handleRateLimit(retryAfter: number) {
    this.onRateLimit?.(retryAfter);
    globalRateLimitHandler?.(retryAfter);
  }

  private async cachedRequest<T>(
    endpoint: string,
    params: Record<string, string>,
    requestFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cacheKey = getCacheKey(endpoint, params);
    
    // Check cache first
    const cached = getCached<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Make request with queueing
    try {
      const data = await queuedRequest(cacheKey, async () => {
        try {
          return await requestFn();
        } catch (error) {
          if (error instanceof Error && error.message === "RATE_LIMIT") {
            // Rate limit detected
            const retryAfter = 60; // Default 60 seconds
            this.handleRateLimit(retryAfter);
            throw new Error(`RATE_LIMIT:${retryAfter}`);
          }
          throw error;
        }
      });

      // Cache the result
      setCache(cacheKey, data, ttl);
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("RATE_LIMIT:")) {
        throw error; // Re-throw rate limit errors
      }
      throw error;
    }
  }

  // Quote endpoints
  async getQuote(symbol: string): Promise<finnhub.FinnhubQuote> {
    return this.cachedRequest(
      "/quote",
      { symbol },
      () => finnhub.getQuote(symbol, this.apiKey),
      CACHE_TTL.QUOTE
    );
  }

  // Candle/Price history
  async getCandle(
    symbol: string,
    resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M",
    from: number,
    to: number
  ): Promise<finnhub.FinnhubCandle> {
    return this.cachedRequest(
      "/stock/candle",
      { symbol, resolution, from: from.toString(), to: to.toString() },
      () => finnhub.getCandle(symbol, resolution, from, to, this.apiKey),
      CACHE_TTL.CANDLE
    );
  }

  // News endpoints
  async getCompanyNews(
    symbol: string,
    from: string,
    to: string
  ): Promise<finnhub.FinnhubNewsItem[]> {
    return this.cachedRequest(
      "/company-news",
      { symbol, from, to },
      () => finnhub.getCompanyNews(symbol, from, to, this.apiKey),
      CACHE_TTL.NEWS
    );
  }

  async getMarketNews(
    category: "general" | "forex" | "crypto" | "merger" = "general"
  ): Promise<finnhub.FinnhubNewsItem[]> {
    return this.cachedRequest(
      "/news",
      { category },
      () => finnhub.getMarketNews(category, this.apiKey),
      CACHE_TTL.MARKET_NEWS
    );
  }

  // Company data
  async getCompanyProfile(
    symbol: string
  ): Promise<finnhub.FinnhubCompanyProfile> {
    return this.cachedRequest(
      "/stock/profile2",
      { symbol },
      () => finnhub.getCompanyProfile(symbol, this.apiKey),
      CACHE_TTL.PROFILE
    );
  }

  async getBasicFinancials(
    symbol: string
  ): Promise<finnhub.FinnhubBasicFinancials> {
    return this.cachedRequest(
      "/stock/metric",
      { symbol, metric: "all" },
      () => finnhub.getBasicFinancials(symbol, this.apiKey),
      CACHE_TTL.METRICS
    );
  }

  // Earnings
  async getEarningsCalendar(
    from: string,
    to: string
  ): Promise<finnhub.FinnhubEarningsItem[]> {
    return this.cachedRequest(
      "/calendar/earnings",
      { from, to },
      () => finnhub.getEarningsCalendar(from, to, this.apiKey),
      CACHE_TTL.EARNINGS
    );
  }

  // Search
  async searchSymbol(query: string): Promise<finnhub.FinnhubSearchResult[]> {
    return this.cachedRequest(
      "/search",
      { q: query },
      () => finnhub.searchSymbol(query, this.apiKey),
      CACHE_TTL.SEARCH
    );
  }
}
