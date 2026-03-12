import { useState, useEffect } from 'react';
import { FileText, Loader2, Download, AlertCircle } from 'lucide-react';
import { getSectors, generateReport } from '../api';
import { Sector, ReportData } from '../types';
import SectorSelector from '../components/SectorSelector';

export default function Reports() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState('corporate_travel');
  const [customTopic, setCustomTopic] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSectors().then(setSectors).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await generateReport(selectedSector, customTopic);
      setReport(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to generate report. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    let text = `# ${report.title}\n\nGenerated: ${report.generated_at}\nSector: ${report.sector}\n\n## Executive Summary\n\n${report.executive_summary}\n\n`;
    report.sections.forEach((s) => { text += `## ${s.heading}\n\n${s.content}\n\n`; });
    text += `## Recommendations\n\n${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.sector.replace(/\s+/g, '_')}_report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-400" />
          Report Generator
        </h1>
        <p className="text-dark-400 mt-1">Generate AI-powered insight reports for stakeholders</p>
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
          onClick={handleGenerate}
          disabled={loading || (selectedSector === 'custom' && !customTopic)}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {loading ? 'Generating Report...' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {report && (
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-dark-700">
            <div>
              <h2 className="text-xl font-bold text-white">{report.title}</h2>
              <p className="text-sm text-dark-400 mt-1">
                {report.sector} &middot; Generated {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Executive Summary</h3>
              <p className="text-dark-300 text-sm leading-relaxed">{report.executive_summary}</p>
            </div>

            {report.sections.map((section, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider mb-3">{section.heading}</h3>
                <p className="text-dark-300 text-sm leading-relaxed">{section.content}</p>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">Recommendations</h3>
              <ol className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-dark-300">{rec}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
