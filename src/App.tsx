import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TrendAnalysis from './pages/TrendAnalysis';
import InsightsAgent from './pages/InsightsAgent';
import HousingData from './pages/HousingData';
import History from './pages/History';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trends" element={<TrendAnalysis />} />
          <Route path="/agent" element={<InsightsAgent />} />
          <Route path="/housing" element={<HousingData />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
}
