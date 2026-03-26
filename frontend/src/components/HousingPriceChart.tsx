import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { HousingSeries } from '../types';

const SERIES_COLORS: Record<string, string> = {
  CSUSHPINSA: '#3b82f6',
  MSPUS: '#10b981',
  MORTGAGE30US: '#f59e0b',
  HOUST: '#06b6d4',
  MSACSR: '#ef4444',
};

interface HousingPriceChartProps {
  series: HousingSeries;
  compact?: boolean;
}

function formatValue(value: number, units: string): string {
  if (units === 'USD') {
    return `$${value.toLocaleString()}`;
  }
  if (units === 'Percent') {
    return `${value.toFixed(2)}%`;
  }
  if (units.includes('Thousands')) {
    return `${value.toFixed(0)}K`;
  }
  if (units === 'Months') {
    return `${value.toFixed(1)} mo`;
  }
  return value.toFixed(1);
}

function formatYAxis(value: number, units: string): string {
  if (units === 'USD') {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  }
  if (units === 'Percent') return `${value}%`;
  return `${value}`;
}

export default function HousingPriceChart({ series, compact = false }: HousingPriceChartProps) {
  const color = SERIES_COLORS[series.id] || '#3b82f6';
  const gradientId = `gradient-${series.id}`;
  const height = compact ? 200 : 280;

  const latestValue = series.data.length > 0 ? series.data[series.data.length - 1].value : 0;
  const prevValue = series.data.length > 1 ? series.data[series.data.length - 2].value : latestValue;
  const changePercent = prevValue !== 0 ? ((latestValue - prevValue) / prevValue) * 100 : 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="bg-dark-900/50 border border-dark-700/50 rounded-2xl p-5 hover:border-dark-600 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider truncate">
            {series.title}
          </h3>
          <p className="text-xs text-dark-500 mt-0.5">{series.frequency} | {series.units}</p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className="text-lg font-bold text-white">{formatValue(latestValue, series.units)}</p>
          <p className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={series.data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={(d) => {
              const date = new Date(d);
              return `${date.toLocaleString('default', { month: 'short' })} '${String(date.getFullYear()).slice(2)}`;
            }}
            interval={compact ? 'preserveStartEnd' : Math.floor(series.data.length / 6)}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatYAxis(v, series.units)}
            width={65}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [formatValue(value, series.units), series.title]}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: color, fill: '#1e293b', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
