import { supabase } from './supabase';
import type { TrendResult } from '../types';

export interface SavedAnalysis {
  id: string;
  user_id: string;
  sector: string;
  topic: string;
  summary: string;
  sentiment: { positive: number; neutral: number; negative: number };
  trending_topics: { topic: string; count: number; sentiment: number }[];
  volume_over_time: { date: string; count: number }[];
  key_insights: string[];
  sources: { title: string; source: string; url: string; date: string; snippet: string }[];
  created_at: string;
}

export async function saveAnalysis(userId: string, result: TrendResult): Promise<{ error: string | null }> {
  const { error } = await supabase.from('saved_analyses').insert({
    user_id: userId,
    sector: result.sector,
    topic: result.topic,
    summary: result.summary,
    sentiment: result.sentiment,
    trending_topics: result.trending_topics,
    volume_over_time: result.volume_over_time,
    key_insights: result.key_insights,
    sources: result.sources,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function getSavedAnalyses(): Promise<SavedAnalysis[]> {
  const { data, error } = await supabase
    .from('saved_analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as SavedAnalysis[];
}

export async function deleteAnalysis(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('saved_analyses').delete().eq('id', id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function getAnalysisCount(): Promise<number> {
  const { count, error } = await supabase
    .from('saved_analyses')
    .select('*', { count: 'exact', head: true });

  if (error || count === null) return 0;
  return count;
}
