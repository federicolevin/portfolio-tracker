import type { NextApiRequest, NextApiResponse } from 'next';

interface PriceData {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

// Map common asset names to symbols
const symbolMap: { [key: string]: string } = {
  // Stocks
  'apple inc': 'AAPL',
  'apple': 'AAPL',
  'microsoft': 'MSFT',
  'microsoft corporation': 'MSFT',
  'google': 'GOOGL',
  'alphabet': 'GOOGL',
  'amazon': 'AMZN',
  'tesla': 'TSLA',
  'meta': 'META',
  'facebook': 'META',
  'netflix': 'NFLX',
  'nvidia': 'NVDA',
  'salesforce': 'CRM',
  'adobe': 'ADBE',
  
  // Crypto
  'bitcoin': 'BTC-USD',
  'ethereum': 'ETH-USD',
  'cardano': 'ADA-USD',
  'solana': 'SOL-USD',
  'dogecoin': 'DOGE-USD',
  'polygon': 'MATIC-USD',
  'chainlink': 'LINK-USD',
  'polkadot': 'DOT-USD',
  
  // ETFs
  'spy': 'SPY',
  'qqq': 'QQQ',
  'vti': 'VTI',
  'voo': 'VOO',
  'arkk': 'ARKK',
  'gold etf': 'GLD',
  'silver etf': 'SLV',
  
  // Commodities
  'gold': 'GC=F',
  'silver': 'SI=F',
  'oil': 'CL=F',
  'crude oil': 'CL=F',
  'natural gas': 'NG=F'
};

function getSymbolFromName(assetName: string): string {
  const normalizedName = assetName.toLowerCase().trim();
  
  // Check if it's already a symbol (all caps, short)
  if (assetName.length <= 5 && assetName === assetName.toUpperCase()) {
    return assetName;
  }
  
  // Check symbol map
  if (symbolMap[normalizedName]) {
    return symbolMap[normalizedName];
  }
  
  // Try to extract symbol from name (look for patterns like "Apple (AAPL)")
  const symbolMatch = assetName.match(/\(([A-Z]{1,5})\)/);
  if (symbolMatch) {
    return symbolMatch[1];
  }
  
  // Default to using the name as is
  return assetName.toUpperCase().replace(/\s+/g, '');
}

async function fetchAssetPrice(assetName: string): Promise<PriceData | null> {
  try {
    const symbol = getSymbolFromName(assetName);
    
    // Using Yahoo Finance API
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Yahoo Finance API error for ${symbol}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      console.error(`Invalid response format for ${symbol}:`, data);
      return null;
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    
    if (!meta) {
      console.error(`Missing meta data for ${symbol}`);
      return null;
    }
    
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose;
    
    if (currentPrice === undefined || previousClose === undefined) {
      console.error(`Missing price data for ${symbol}`);
      return null;
    }
    
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    return {
      symbol: meta.symbol || symbol,
      currentPrice: currentPrice,
      change: change,
      changePercent: changePercent,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error fetching price for ${assetName}:`, error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { assetNames } = req.body;

    if (!assetNames || !Array.isArray(assetNames)) {
      return res.status(400).json({ error: 'assetNames array is required' });
    }

    // Fetch prices for all assets
    const pricePromises = assetNames.map(async (name: string) => {
      const priceData = await fetchAssetPrice(name);
      return { name, priceData };
    });

    const results = await Promise.all(pricePromises);

    // Create response object
    const priceMap: { [key: string]: PriceData | null } = {};
    results.forEach(({ name, priceData }) => {
      priceMap[name] = priceData;
    });

    // Set cache headers for 1 minute
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    
    return res.status(200).json(priceMap);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
}
