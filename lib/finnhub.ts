const BASE_URL = "https://finnhub.io/api/v1";

export type FinnhubQuote = {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
};

export type FinnhubCandle = {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volume
};

export type FinnhubNewsItem = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

export type FinnhubCompanyProfile = {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
};

export type FinnhubBasicFinancials = {
  metric: {
    "52WeekHigh": number;
    "52WeekLow": number;
    "52WeekLowDate": string;
    "52WeekPriceReturnDaily": number;
    beta: number;
    dividendYieldIndicatedAnnual: number;
    epsAnnual: number;
    marketCapitalization: number;
    peAnnual: number;
    priceToBookAnnual: number;
    priceToSalesAnnual: number;
  };
  series: Record<string, unknown>;
  symbol: string;
};

export type FinnhubEarningsItem = {
  date: string;
  epsActual?: number;
  epsEstimate?: number;
  hour: string; // "bmo" (before market open) or "amc" (after market close)
  quarter?: number;
  revenueActual?: number;
  revenueEstimate?: number;
  symbol: string;
  year: number;
};

export type FinnhubSearchResult = {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
};

export type FinnhubSearchResponse = {
  count: number;
  result: FinnhubSearchResult[];
};

async function fetchFinnhub<T>(
  endpoint: string,
  params: Record<string, string>,
  apiKey: string
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries({ ...params, token: apiKey }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  
  if (response.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  
  if (response.status === 403) {
    throw new Error("ACCESS_DENIED: This feature requires a premium Finnhub plan. Try a different endpoint or upgrade your API key.");
  }

  if (response.status === 401) {
    throw new Error("INVALID_KEY: Invalid API key. Please check your Finnhub API key.");
  }
  
  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  
  // Finnhub returns empty object {} or {s: "no_data"} for some invalid requests
  if (data && typeof data === "object" && data.s === "no_data") {
    throw new Error("NO_DATA: No data available for this symbol/period.");
  }

  // Check for error in response
  if (data.error) {
    throw new Error(data.error);
  }

  return data as T;
}

export async function getQuote(
  symbol: string,
  apiKey: string
): Promise<FinnhubQuote> {
  const data = await fetchFinnhub<FinnhubQuote>("/quote", { symbol }, apiKey);
  // Finnhub returns all zeros for invalid symbols
  if (data.c === 0 && data.h === 0 && data.l === 0 && data.o === 0 && data.pc === 0) {
    throw new Error(`No quote data for "${symbol}". Check the symbol is valid.`);
  }
  return data;
}

export async function getCandle(
  symbol: string,
  resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M",
  from: number, // Unix timestamp
  to: number, // Unix timestamp
  apiKey: string
): Promise<FinnhubCandle> {
  return fetchFinnhub<FinnhubCandle>(
    "/stock/candle",
    {
      symbol,
      resolution,
      from: from.toString(),
      to: to.toString(),
    },
    apiKey
  );
}

export async function getCompanyNews(
  symbol: string,
  from: string, // YYYY-MM-DD
  to: string, // YYYY-MM-DD
  apiKey: string
): Promise<FinnhubNewsItem[]> {
  return fetchFinnhub<FinnhubNewsItem[]>(
    "/company-news",
    { symbol, from, to },
    apiKey
  );
}

export async function getCompanyProfile(
  symbol: string,
  apiKey: string
): Promise<FinnhubCompanyProfile> {
  return fetchFinnhub<FinnhubCompanyProfile>(
    "/stock/profile2",
    { symbol },
    apiKey
  );
}

export async function getBasicFinancials(
  symbol: string,
  apiKey: string
): Promise<FinnhubBasicFinancials> {
  return fetchFinnhub<FinnhubBasicFinancials>(
    "/stock/metric",
    { symbol, metric: "all" },
    apiKey
  );
}

export async function getMarketNews(
  category: "general" | "forex" | "crypto" | "merger",
  apiKey: string
): Promise<FinnhubNewsItem[]> {
  return fetchFinnhub<FinnhubNewsItem[]>(
    "/news",
    { category },
    apiKey
  );
}

export async function getEarningsCalendar(
  from: string, // YYYY-MM-DD
  to: string, // YYYY-MM-DD
  apiKey: string
): Promise<FinnhubEarningsItem[]> {
  const data = await fetchFinnhub<{ earningsCalendar: FinnhubEarningsItem[] }>(
    "/calendar/earnings",
    { from, to },
    apiKey
  );
  return data.earningsCalendar || [];
}

export async function searchSymbol(
  query: string,
  apiKey: string
): Promise<FinnhubSearchResult[]> {
  const data = await fetchFinnhub<FinnhubSearchResponse>(
    "/search",
    { q: query },
    apiKey
  );
  return data.result || [];
}
