import type {
  AppSettings,
  SavedAbyssPair,
  SavedTeam,
} from '../types/genshin';
import { DEFAULT_SPREADSHEET_ID } from './sheetsApi';

const SETTINGS_KEY = 'genshin_guru_settings_v1';
const SAVED_TEAMS_KEY = 'genshin_guru_saved_teams_v1';
const SAVED_ABYSS_KEY = 'genshin_guru_saved_abyss_v1';

export function loadSettings(): AppSettings {
  const envSheetId =
    (import.meta.env.VITE_SPREADSHEET_ID as string | undefined) ||
    DEFAULT_SPREADSHEET_ID;
  const envSheetsKey =
    (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string | undefined) || '';
  const envGeminiKey =
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';

  const defaults: AppSettings = {
    spreadsheetId: envSheetId,
    sheetsApiKey: envSheetsKey,
    geminiApiKey: envGeminiKey,
    lastSyncedAt: null,
    dataSource: 'snapshot',
  };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaults,
      ...parsed,
      spreadsheetId: parsed.spreadsheetId || defaults.spreadsheetId,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

export function loadSavedTeams(): SavedTeam[] {
  try {
    const raw = localStorage.getItem(SAVED_TEAMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSavedTeams(teams: SavedTeam[]): void {
  try {
    localStorage.setItem(SAVED_TEAMS_KEY, JSON.stringify(teams));
  } catch {
    // ignore
  }
}

export function loadSavedAbyssPairs(): SavedAbyssPair[] {
  try {
    const raw = localStorage.getItem(SAVED_ABYSS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSavedAbyssPairs(pairs: SavedAbyssPair[]): void {
  try {
    localStorage.setItem(SAVED_ABYSS_KEY, JSON.stringify(pairs));
  } catch {
    // ignore
  }
}
