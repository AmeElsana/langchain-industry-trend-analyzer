import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { getSectors, analyzeTrends } from '../api';
import { Sector, TrendResult } from '../types';
import SectorSelector from '../components/SectorSelector';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function TrendAnalysis() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState('corporate_travel');
  const [customTopic, setCustomTopic] = useState('');
  const [result, setResult] = useState<TrendResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSectors().then(setSectors).catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await analyzeTrends(selectedSector, customTopic);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to analyze trends. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = result
    ? [
        { name: 'Positive', value: result.sentiment.positive },
        { name: 'Neutral', value: result.sentiment.neutral },
        { name: 'Negative', value: result.sentiment.negative },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-400" />
          Trend Analysis
        </h1>
        <p className="text-dark-400 mt-1">Select a sector and analyze real-time industry trends</p>
      </div>

      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6 space-y-4">
        <SectorSelector
          sectors={sectors}
          selected={selectedSector}
          onSelect={setSelectedSector}
          customTopic={customTopic}
          onCustomTopicChange={setCustomTopic}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || (selectedSector === 'custom' && !customTopic)}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Analyze Trends'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Summary</h2>
            <p className="text-dark-300 text-sm leading-relaxed">{result.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-dark-300 mb-4 uppercase tracking-wider">Sentiment Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {sentimentData.map((_, i) => (
                      <Cell key={i} fill={['#10b981', '#64748b', '#ef4444'][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-dark-300 mb-4 uppercase tracking-wider">Trending Topics</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={result.trending_topics.slice(0, 7)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="topic" type="category" stroke="#64748b" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-300 mb-4 uppercase tracking-wider">Discussion Volume Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.volume_over_time}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#volumeGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-300 mb-4 uppercase tracking-wider">Key Insights</h3>
            <ul className="space-y-3">
              {result.key_insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-dark-300">{insight}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-dark-300 mb-4 uppercase tracking-wider">Sources</h3>
            <div className="space-y-3">
              {result.sources.slice(0, 10).map((source, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-dark-900/50">
                  <span className="text-xs text-dark-500 shrink-0 mt-1">{source.source}</span>
                  <div>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:underline">
                      {source.title}
                    </a>
                    <p className="text-xs text-dark-400 mt-1">{source.snippet}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
