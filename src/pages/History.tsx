import { useState, useEffect } from 'react';
import { Clock, Trash2, Loader as Loader2, ChevronDown, ChevronUp, ChartBar as BarChart3, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getSavedAnalyses, deleteAnalysis, type SavedAnalysis } from '../lib/analyses';

export default function History() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setLoading(true);
    const data = await getSavedAnalyses();
    setAnalyses(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await deleteAnalysis(id);
    if (!error) {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeleting(null);
  };

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-400" />
          Analysis History
        </h1>
        <p className="text-dark-400 mt-1">Your saved trend analyses</p>
      </div>

      {analyses.length === 0 ? (
        <div className="bg-dark-900/50 border border-dark-700/50 rounded-2xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-300 mb-2">No saved analyses yet</h3>
          <p className="text-sm text-dark-500">Run a trend analysis and save it to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => {
            const isExpanded = expandedId === analysis.id;
            const sentimentData = [
              { name: 'Positive', value: analysis.sentiment.positive },
              { name: 'Neutral', value: analysis.sentiment.neutral },
              { name: 'Negative', value: analysis.sentiment.negative },
            ];

            return (
              <div
                key={analysis.id}
                className="bg-dark-900/50 border border-dark-700/50 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggle(analysis.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-dark-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{analysis.topic}</h3>
                      <p className="text-xs text-dark-500 mt-0.5">
                        {analysis.sector} -- {new Date(analysis.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                        {analysis.sentiment.positive}% pos
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(analysis.id); }}
                      disabled={deleting === analysis.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-colors"
                    >
                      {deleting === analysis.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-dark-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-dark-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-dark-800 pt-4 animate-in">
                    <p className="text-sm text-dark-300 leading-relaxed">{analysis.summary}</p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Sentiment</h4>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                              {sentimentData.map((_, i) => (
                                <Cell key={i} fill={['#10b981', '#64748b', '#ef4444'][i]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Key Insights</h4>
                        <ul className="space-y-2">
                          {analysis.key_insights.slice(0, 3).map((insight, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <p className="text-xs text-dark-300 leading-relaxed">{insight}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {analysis.trending_topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {analysis.trending_topics.slice(0, 6).map((t, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-xs text-dark-300">
                            {t.topic} ({t.count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
