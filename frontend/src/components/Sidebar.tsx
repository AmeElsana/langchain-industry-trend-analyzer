import { NavLink } from 'react-router-dom';
import { BarChart3, Bot, FileText, Home, Search, TrendingUp } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/trends', icon: TrendingUp, label: 'Trend Analysis' },
  { to: '/insights', icon: Bot, label: 'AI Insights' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">TrendLens</h1>
            <p className="text-xs text-dark-400">Industry Trend Analyzer</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800">
          <BarChart3 className="w-4 h-4 text-primary-400" />
          <span className="text-xs text-dark-300">Powered by LangChain</span>
        </div>
      </div>
    </aside>
  );
}
