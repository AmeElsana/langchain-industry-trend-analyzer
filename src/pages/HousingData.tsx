import { useState, useEffect } from 'react';
import { Hop as Home, Loader as Loader2, CircleAlert as AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchHousingData } from '../api';
import { HousingSeries } from '../types';
import HousingPriceChart from '../components/HousingPriceChart';

const SERIES_DESCRIPTIONS: Record<string, string> = {
  CSUSHPINSA: 'Tracks changes in the value of residential real estate nationally.',
  MSPUS: 'The middle price point of all houses sold in the US.',
  MORTGAGE30US: 'The average interest rate for a 30-year fixed-rate mortgage.',
  HOUST: 'New residential construction projects started monthly.',
  MSACSR: 'How many months to sell all current inventory at the current sales pace.',
};

export default function HousingData() {
  const [allSeries, setAllSeries] = useState<HousingSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchHousingData();
      setAllSeries(response.series);
      setFetchedAt(response.fetched_at);
    } catch {
      setError('Failed to load housing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getMetricSummary = (series: HousingSeries) => {
    if (series.data.length < 2) return { change: 0, direction: 'flat' as const };
    const latest = series.data[series.data.length - 1].value;
    const yearAgo = series.data[Math.max(0, series.data.length - 13)]?.value || latest;
    const change = ((latest - yearAgo) / yearAgo) * 100;
    const direction = change > 0.5 ? 'up' as const : change < -0.5 ? 'down' as const : 'flat' as const;
    return { change, direction };
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-blue-400" />
            Housing Market Data
          </h1>
          <p className="text-dark-400 mt-1">
            Real housing price indices and market indicators from FRED
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-dark-900/50 hover:bg-dark-800 disabled:opacity-50 text-dark-300 hover:text-white rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-dark-700/50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {fetchedAt && !loading && (
        <p className="text-xs text-dark-500">
          Last updated: {new Date(fetchedAt).toLocaleString()}
        </p>
      )}

      {loading && allSeries.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Loading housing market data...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {allSeries.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {allSeries.map((series) => {
              const { change, direction } = getMetricSummary(series);
              const latest = series.data[series.data.length - 1];
              const DirectionIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
              const dirColor = direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-red-400' : 'text-dark-400';

              return (
                <div key={series.id} className="bg-dark-900/50 border border-dark-700/50 rounded-2xl p-4 hover:border-dark-600 transition-all duration-200">
                  <p className="text-xs text-dark-500 mb-1 truncate">{series.id}</p>
                  <p className="text-lg font-bold text-white">
                    {series.units === 'USD'
                      ? `$${(latest?.value || 0).toLocaleString()}`
                      : series.units === 'Percent'
                        ? `${(latest?.value || 0).toFixed(2)}%`
                        : (latest?.value || 0).toFixed(1)}
                  </p>
                  <div className={`flex items-center gap-1 mt-1 ${dirColor}`}>
                    <DirectionIcon className="w-3 h-3" />
                    <span className="text-xs font-medium">
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}% YoY
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {allSeries.slice(0, 2).map((series) => (
                <HousingPriceChart key={series.id} series={series} />
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {allSeries.slice(2).map((series) => (
                <HousingPriceChart key={series.id} series={series} compact />
              ))}
            </div>
          </div>

          <div className="bg-dark-900/50 border border-dark-700/50 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-dark-400 mb-4 uppercase tracking-wider">
              Indicator Descriptions
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {allSeries.map((series) => (
                <div key={series.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-white">{series.title}</p>
                    <p className="text-xs text-dark-500 mt-0.5">
                      {SERIES_DESCRIPTIONS[series.id] || `${series.frequency} data in ${series.units}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
