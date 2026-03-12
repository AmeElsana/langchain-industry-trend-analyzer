export interface Sector {
  id: string;
  name: string;
  description: string;
  icon: string;
  keywords: string[];
}

export interface TrendResult {
  sector: string;
  topic: string;
  summary: string;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  trending_topics: { topic: string; count: number; sentiment: number }[];
  volume_over_time: { date: string; count: number }[];
  key_insights: string[];
  sources: { title: string; source: string; url: string; date: string; snippet: string }[];
}

export interface AnalysisRequest {
  sector_id: string;
  custom_topic?: string;
}

export interface ReportData {
  title: string;
  generated_at: string;
  sector: string;
  executive_summary: string;
  sections: { heading: string; content: string }[];
  recommendations: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
