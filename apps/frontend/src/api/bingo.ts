import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export interface Pokemon {
  name: string;
  sprite: string;
  shinySprite: string;
  game: string;
  gameLabel: string;
}

export interface GenerateRequest {
  gridSize: number;
  games: string[];
  language?: string;
}

export interface GenerateResponse {
  grid: Pokemon[][];
  extras: Pokemon[];
}

export interface Language {
  code: string;
  label: string;
}

export async function generateBingo(req: GenerateRequest): Promise<GenerateResponse> {
  const res = await api.post<GenerateResponse>('/bingo/generate', req);
  return res.data;
}

export async function getAvailableLanguages(): Promise<Language[]> {
  const res = await api.get<{ languages: Language[] }>('/bingo/languages');
  return res.data.languages;
}

export async function getGameNames(lang: string): Promise<Record<string, string>> {
  const res = await api.get<{ names: Record<string, string> }>(`/bingo/game-names?lang=${lang}`);
  return res.data.names;
}
