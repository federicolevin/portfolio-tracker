// Price fetching service for stocks, crypto, and other assets
export interface PriceData {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

// Fetch single asset price through our API endpoint
export async function fetchAssetPrice(assetName: string): Promise<PriceData | null> {
  try {
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetNames: [assetName] }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data[assetName] || null;
  } catch (error) {
    console.error(`Error fetching price for ${assetName}:`, error);
    return null;
  }
}

// Batch fetch multiple asset prices through our API endpoint
export async function fetchMultipleAssetPrices(assetNames: string[]): Promise<{ [key: string]: PriceData | null }> {
  try {
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assetNames }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching multiple asset prices:', error);
    // Return empty object with null values for all assets
    const fallbackData: { [key: string]: PriceData | null } = {};
    assetNames.forEach(name => {
      fallbackData[name] = null;
    });
    return fallbackData;
  }
}

// Calculate performance metrics
export interface PerformanceMetrics {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export function calculatePerformance(
  quantity: number,
  purchasePrice: number,
  currentPrice: number,
  dayChange: number
): {
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChangeValue: number;
} {
  const currentValue = quantity * currentPrice;
  const costBasis = quantity * purchasePrice;
  const gainLoss = currentValue - costBasis;
  const gainLossPercent = (gainLoss / costBasis) * 100;
  const dayChangeValue = quantity * dayChange;
  
  return {
    currentValue,
    costBasis,
    gainLoss,
    gainLossPercent,
    dayChangeValue
  };
}
