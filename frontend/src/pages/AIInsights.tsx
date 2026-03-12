import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';
import { getSectors, chatWithAgent } from '../api';
import { Sector, ChatMessage } from '../types';

export default function AIInsights() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState('corporate_travel');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSectors().then(setSectors).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await chatWithAgent(input, selectedSector);
      const assistantMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = { role: 'assistant', content: 'Failed to get response. Make sure the backend is running.', timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    'What are the top trends in this sector right now?',
    'Summarize the overall market sentiment.',
    'What are the biggest pain points customers mention?',
    'Identify emerging competitors or technologies.',
    'What recommendations would you give a product marketing team?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-400" />
          AI Insights Agent
        </h1>
        <p className="text-dark-400 mt-1">
          Chat with a LangChain-powered agent about industry trends and market insights
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-dark-400">Sector:</span>
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="bg-dark-800 border border-dark-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500"
        >
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 bg-dark-800/50 border border-dark-700 rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-12 h-12 text-purple-400/30 mb-4" />
              <h3 className="text-lg font-semibold text-dark-300 mb-2">Ask anything about industry trends</h3>
              <p className="text-sm text-dark-500 mb-6 max-w-md">
                This agent uses LangChain to analyze data from Reddit, HackerNews, and news sources to provide market insights.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 rounded-full bg-dark-700 border border-dark-600 text-xs text-dark-300 hover:text-white hover:border-dark-400 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-200'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">TrendLens AI</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-dark-700 rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm text-dark-400">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-dark-700 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about industry trends, sentiment, competitors..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-600 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
