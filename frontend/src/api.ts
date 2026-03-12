import axios from 'axios';
import { TrendResult, ReportData, Sector } from './types';

const API_BASE = '/api';

export async function getSectors(): Promise<Sector[]> {
  const res = await axios.get(`${API_BASE}/sectors`);
  return res.data;
}

export async function analyzeTrends(sectorId: string, customTopic?: string): Promise<TrendResult> {
  const res = await axios.post(`${API_BASE}/analyze`, {
    sector_id: sectorId,
    custom_topic: customTopic,
  });
  return res.data;
}

export async function generateReport(sectorId: string, customTopic?: string): Promise<ReportData> {
  const res = await axios.post(`${API_BASE}/report`, {
    sector_id: sectorId,
    custom_topic: customTopic,
  });
  return res.data;
}

export async function chatWithAgent(message: string, sectorId: string): Promise<string> {
  const res = await axios.post(`${API_BASE}/chat`, {
    message,
    sector_id: sectorId,
  });
  return res.data.response;
}
