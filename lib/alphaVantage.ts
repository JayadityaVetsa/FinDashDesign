const BASE_URL = "https://www.alphavantage.co/query";

export type GlobalQuote = {
  symbol: string;
  price: number;
  changePercent: number;
  lastTradingDay: string;
};

export type DailySeriesPoint = {
  date: string;
  close: number;
};

export type NewsItem = {
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
};

type AlphaVantageError = {
  Note?: string;
  "Error Message"?: string;
  Information?: string;
};

async function fetchAlphaVantage<T>(
  params: Record<string, string>,
  apiKey: string
): Promise<T> {
  const url = new URL(BASE_URL);
  Object.entries({ ...params, apikey: apiKey }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Alpha Vantage error: ${response.status}`);
  }
  const data = (await response.json()) as T & AlphaVantageError;
  if (data.Note) {
    throw new Error("Rate limit reached — wait ~60s and retry.");
  }
  if (data.Information) {
    // Alpha Vantage returns verbose rate-limit text in Information field
    if (String(data.Information).toLowerCase().includes("rate limit") ||
        String(data.Information).toLowerCase().includes("request")) {
      throw new Error("Rate limit reached — wait ~60s and retry.");
    }
    throw new Error(data.Information);
  }
  if (data["Error Message"]) {
    throw new Error(data["Error Message"]);
  }
  return data;
}

export async function fetchGlobalQuote(
  symbol: string,
  apiKey: string
): Promise<GlobalQuote> {
  const data = await fetchAlphaVantage<{
    "Global Quote"?: Record<string, string>;
  }>(
    {
      function: "GLOBAL_QUOTE",
      symbol,
    },
    apiKey
  );

  const quote = data["Global Quote"];
  if (!quote || Object.keys(quote).length === 0) {
    throw new Error(`No quote data found for ${symbol}.`);
  }

  const price = Number(quote["05. price"] ?? 0);
  const changePercent = Number(
    (quote["10. change percent"] ?? "0").replace("%", "")
  );

  return {
    symbol: quote["01. symbol"] ?? symbol.toUpperCase(),
    price,
    changePercent,
    lastTradingDay: quote["07. latest trading day"] ?? "",
  };
}

export async function fetchDailySeries(
  symbol: string,
  apiKey: string
): Promise<DailySeriesPoint[]> {
  const data = await fetchAlphaVantage<{
    "Time Series (Daily)"?: Record<string, Record<string, string>>;
  }>(
    {
      function: "TIME_SERIES_DAILY",
      symbol,
      outputsize: "compact",
    },
    apiKey
  );

  const series = data["Time Series (Daily)"];
  if (!series || Object.keys(series).length === 0) {
    throw new Error(`No price history found for ${symbol}.`);
  }

  return Object.entries(series)
    .map(([date, values]) => ({
      date,
      close: Number(values["4. close"] ?? 0),
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export async function fetchNews(
  tickers: string,
  apiKey: string
): Promise<NewsItem[]> {
  const data = await fetchAlphaVantage<{
    feed?: Array<{
      title: string;
      url: string;
      summary: string;
      source: string;
      time_published: string;
    }>;
  }>(
    {
      function: "NEWS_SENTIMENT",
      tickers,
      sort: "LATEST",
      limit: "20",
    },
    apiKey
  );

  if (!data.feed || data.feed.length === 0) {
    return [];
  }

  return data.feed.map((item) => ({
    title: item.title,
    url: item.url,
    summary: item.summary ?? "",
    source: item.source ?? "",
    publishedAt: item.time_published ?? "",
  }));
}
