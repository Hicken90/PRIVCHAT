'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LangCode } from './i18n';

export type Plan = 'free' | 'basic' | 'pro';
export type Theme = 'retro' | 'modern-dark' | 'modern-light';
export const THEME_KEY = 'shadowchat_theme';

export interface AppState {
  lang: LangCode | null;
  onboarded: boolean;
  username: string;
  pin: string | null;
  encryptData: boolean;
  incognito: boolean;
  plan: Plan;
  messagesUsedToday: number;
  lastUsageDate: string;
  apiKeys: {
    groq: string;
    openrouter: string;
    gemini: string;
    ollama: string;
  };
  friends: Friend[];
  conversations: Conversation[];
  bonusClaimed: boolean;
  bonusDate: string | null;
  theme: Theme;
}

export interface Friend {
  id: string;
  username: string;
  online: boolean;
  publicKey?: string;
  addedAt: number;
}

export interface Message {
  id: string;
  text: string;
  sent: boolean;
  timestamp: number;
  read: boolean;
  save: boolean;
  selfDestruct?: boolean;
  deleted?: boolean;
  replyToId?: string;
  forwarded?: boolean;
}

export interface Conversation {
  friendId: string;
  messages: Message[];
  isGroup?: boolean;
  participants?: string[];
}

const STORAGE_KEY = 'shadowchat98_state';
const DEFAULT_STATE: AppState = {
  lang: null,
  onboarded: false,
  username: '',
  pin: null,
  encryptData: false,
  incognito: false,
  plan: 'free',
  messagesUsedToday: 0,
  lastUsageDate: new Date().toDateString(),
  apiKeys: { groq: '', openrouter: '', gemini: '', ollama: '' },
  friends: [],
  conversations: [],
  bonusClaimed: false,
  bonusDate: null,
  theme: 'retro',
};

export function generateUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `user-${suffix}`;
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  if (state.incognito) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function wipeState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.clear();
  if (indexedDB.databases) {
    indexedDB.databases().then((dbs) => dbs.forEach((db) => { if (db.name) indexedDB.deleteDatabase(db.name); }));
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  const update = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return { state, setState, update, loaded };
}

export function checkDailyReset(state: AppState): Partial<AppState> {
  const today = new Date().toDateString();
  if (state.lastUsageDate !== today) {
    return { messagesUsedToday: 0, lastUsageDate: today, bonusClaimed: false, bonusDate: null };
  }
  return {};
}

export function getMessageLimit(plan: Plan): number {
  if (plan === 'basic') return 200;
  if (plan === 'pro') return 1000;
  return 50;
}

export function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'retro';
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'retro' || raw === 'modern-dark' || raw === 'modern-light') return raw;
  } catch {}
  return 'retro';
}

export function saveTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  body.classList.remove('theme-retro', 'theme-modern-dark', 'theme-modern-light');
  if (theme === 'modern-dark') body.classList.add('theme-modern-dark');
  else if (theme === 'modern-light') body.classList.add('theme-modern-light');
  else body.classList.add('theme-retro');
}

export function getThemeClass(theme: Theme): string {
  if (theme === 'modern-dark') return 'theme-modern-dark';
  if (theme === 'modern-light') return 'theme-modern-light';
  return 'theme-retro';
}
