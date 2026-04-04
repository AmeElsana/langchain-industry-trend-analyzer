import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader as Loader2, Database, ExternalLink, Trash2 } from 'lucide-react';
import { getSectors, sendChatMessage } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { Sector, ChatMessage, ChatResponse } from '../types';

interface DisplayMessage extends ChatMessage {
  sources?: ChatResponse['sources'];
  retrievedCount?: number;
}

export default function InsightsAgent() {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState('corporate_travel');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSectors().then((s) => setSectors(s.filter((x) => x.id !== 'custom'))).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage: DisplayMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const sectorObj = sectors.find((s) => s.id === selectedSector);
      const sectorName = sectorObj?.description || sectorObj?.name || selectedSector;

      const res = await sendChatMessage(
        userMessage.content,
        sectorName,
        user.id,
        history
      );

      const assistantMessage: DisplayMessage = {
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
        sources: res.sources,
        retrievedCount: res.retrieved_count,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${errorMsg}. Make sure you've run a Trend Analysis for this sector first.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-start justify-between flex-wrap gap-4 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            AI Insights Agent
          </h1>
          <p className="text-dark-400 mt-1">
            Ask natural-language questions over live market data using RAG
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSector}
            onChange={(e) => {
              setSelectedSector(e.target.value);
              setMessages([]);
            }}
            className="px-3 py-2 rounded-xl bg-dark-900/50 border border-dark-700/50 text-sm text-dark-200 focus:outline-none focus:border-blue-500"
          >
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-xl hover:bg-dark-800 text-dark-500 hover:text-dark-200 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-dark-200 mb-2">
                Ask anything about market trends
              </h3>
              <p className="text-sm text-dark-500 mb-6">
                This agent uses RAG (Retrieval-Augmented Generation) to search through
                analyzed market data and provide data-backed answers. Run a Trend Analysis
                first to populate the knowledge base.
              </p>
              <div className="space-y-2">
                {[
                  'What are the top trends in this sector?',
                  'What is the overall market sentiment?',
                  'What risks should stakeholders be aware of?',
                  'Summarize the key opportunities right now',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                    }}
                    className="block w-full text-left px-4 py-2.5 rounded-xl bg-dark-900/50 border border-dark-700/50 text-sm text-dark-300 hover:border-dark-500 hover:text-white transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-dark-900/80 border border-dark-700/50 text-dark-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

              {msg.role === 'assistant' && msg.retrievedCount !== undefined && msg.retrievedCount > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-700/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Database className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-dark-500">
                      {msg.retrievedCount} posts retrieved via RAG
                    </span>
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-1">
                      {msg.sources.slice(0, 3).map((src, j) => (
                        <a
                          key={j}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-blue-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{src.title}</span>
                          <span className="text-dark-600 shrink-0">
                            ({src.source})
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-900/80 border border-dark-700/50 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-dark-400">
                  Searching knowledge base & generating response...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4 border-t border-dark-700/50">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about market trends, sentiment, risks, opportunities..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl bg-dark-900/50 border border-dark-700/50 text-white placeholder-dark-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm resize-none transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-dark-600 mt-2 text-center">
          Powered by RAG over Reddit, HackerNews & NewsAPI data
        </p>
      </div>
    </div>
  );
}
