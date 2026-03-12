import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TrendAnalysis from './pages/TrendAnalysis';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trends" element={<TrendAnalysis />} />
          <Route path="/insights" element={<AIInsights />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}
