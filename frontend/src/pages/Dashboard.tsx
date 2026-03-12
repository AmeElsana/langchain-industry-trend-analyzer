import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Bot, FileText, BarChart3, ArrowRight, Zap, Globe, Search } from 'lucide-react';
import { getSectors } from '../api';
import { Sector } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);

  useEffect(() => {
    getSectors().then(setSectors).catch(() => {});
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: 'Trend Analysis',
      desc: 'Analyze real-time trends from Reddit, HackerNews, and news sources across any industry sector.',
      path: '/trends',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Bot,
      title: 'AI Insights Agent',
      desc: 'Chat with a LangChain-powered agent that synthesizes findings and answers questions about market data.',
      path: '/insights',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: FileText,
      title: 'Report Generator',
      desc: 'Auto-generate stakeholder-ready insight reports with executive summaries and recommendations.',
      path: '/reports',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  const stats = [
    { label: 'Sectors Covered', value: sectors.length || 6, icon: Globe },
    { label: 'Data Sources', value: 3, icon: Search },
    { label: 'AI Chains', value: 4, icon: Zap },
    { label: 'Chart Types', value: 5, icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome to TrendLens</h1>
        <p className="text-dark-400 mt-2 text-lg">
          AI-powered industry trend analysis across multiple sectors
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-primary-400" />
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-dark-400">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc, path, color, bg }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="text-left bg-dark-800/50 border border-dark-700 rounded-xl p-6 hover:border-dark-500 transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-dark-400 mb-4">{desc}</p>
            <span className="text-sm text-primary-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              Get started <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        ))}
      </div>

      <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-4 mt-4">
          {[
            { step: '1', text: 'Select an industry sector or enter a custom topic' },
            { step: '2', text: 'Data is fetched from Reddit, HackerNews, and news APIs' },
            { step: '3', text: 'LangChain agents analyze sentiment, trends, and key themes' },
            { step: '4', text: 'View interactive visualizations and generate reports' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm font-bold shrink-0">
                {step}
              </div>
              <p className="text-sm text-dark-300">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-600/10 to-purple-600/10 border border-primary-800/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Tech Stack</h3>
            <p className="text-sm text-dark-400 mt-1">
              React + Vite | TailwindCSS | Recharts | Python FastAPI | LangChain | HuggingFace
            </p>
          </div>
          <div className="flex gap-2">
            {['React', 'Python', 'LangChain', 'HuggingFace'].map((t) => (
              <span key={t} className="px-3 py-1 rounded-full bg-dark-800 border border-dark-600 text-xs text-dark-300">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
