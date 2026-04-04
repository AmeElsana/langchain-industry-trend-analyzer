import { TrendResult, Sector, HousingDataResponse, ChatResponse } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

const SECTORS: Sector[] = [
  { id: 'corporate_travel', name: 'Corporate Travel', description: 'Corporate Travel & Expense', icon: 'briefcase', keywords: ['corporate travel', 'business travel'] },
  { id: 'asset_management', name: 'Asset Management', description: 'Asset Management & Finance', icon: 'dollar-sign', keywords: ['asset management', 'fintech'] },
  { id: 'healthcare', name: 'Healthcare', description: 'Healthcare & Wellness', icon: 'heart', keywords: ['digital health', 'health tech'] },
  { id: 'enterprise_saas', name: 'Enterprise SaaS', description: 'Enterprise SaaS & Technology', icon: 'cpu', keywords: ['enterprise software', 'SaaS'] },
  { id: 'sustainability', name: 'Sustainability', description: 'Sustainability & ESG', icon: 'leaf', keywords: ['sustainability', 'ESG'] },
  { id: 'custom', name: 'Custom Topic', description: 'Enter your own topic', icon: 'plus', keywords: [] },
];

export async function getSectors(): Promise<Sector[]> {
  return SECTORS;
}

export async function analyzeTrends(sectorId: string, customTopic?: string, userId?: string): Promise<TrendResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/trend-analysis`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sector_id: sectorId, custom_topic: customTopic, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(err.error || 'Analysis failed');
  }
  return res.json();
}

export async function fetchHousingData(): Promise<HousingDataResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/housing-data`, { headers });
  if (!res.ok) {
    throw new Error('Failed to fetch housing data');
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  sector: string,
  userId: string,
  history: { role: string; content: string }[]
): Promise<ChatResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, sector, user_id: userId, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Chat request failed' }));
    throw new Error(err.error || 'Chat request failed');
  }
  return res.json();
}
