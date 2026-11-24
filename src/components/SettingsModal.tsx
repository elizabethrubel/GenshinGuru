import { useState } from 'react';
import {
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import type { AppSettings } from '../types/genshin';
import { DEFAULT_SPREADSHEET_ID } from '../services/sheetsApi';
import {
  SNAPSHOT_CHARACTERS,
  SNAPSHOT_PRESETS,
} from '../data/rosterSnapshot';

interface SettingsModalProps {
  settings: AppSettings;
  isSyncing: boolean;
  syncError: string | null;
  onSaveAndSync: (nextSettings: AppSettings) => Promise<void>;
  onSaveOnly: (nextSettings: AppSettings) => void;
  onImportPastedRoster: (rawText: string) => void;
  onResetSnapshot: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  isSyncing,
  syncError,
  onSaveAndSync,
  onSaveOnly,
  onImportPastedRoster,
  onResetSnapshot,
  onClose,
}: SettingsModalProps) {
  const [spreadsheetId, setSpreadsheetId] = useState(
    settings.spreadsheetId || DEFAULT_SPREADSHEET_ID
  );
  const [sheetsApiKey, setSheetsApiKey] = useState(settings.sheetsApiKey);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [pastedRows, setPastedRows] = useState('');

  const buildNextSettings = (): AppSettings => ({
    ...settings,
    spreadsheetId: spreadsheetId.trim() || DEFAULT_SPREADSHEET_ID,
    sheetsApiKey: sheetsApiKey.trim(),
    geminiApiKey: geminiApiKey.trim(),
  });

  return (
    <div
      className="overlay-backdrop centered"
      role="dialog"
      aria-modal="true"
      aria-label="Sync and API Settings"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="drawer-header">
          <div>
            <h3 className="drawer-title">Spreadsheet Refresh &amp; Settings</h3>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {settings.dataSource === 'live-sheets' && settings.lastSyncedAt
                ? `Last refreshed ${new Date(settings.lastSyncedAt).toLocaleString()}`
                : `Using bundled snapshot of your ${SNAPSHOT_CHARACTERS.length} characters & ${SNAPSHOT_PRESETS.length} regional teams`}
            </div>
          </div>
          <button
            type="button"
            className="ghost-action"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="field-group">
            <label htmlFor="input-sheet-id" className="field-label">
              Google Spreadsheet ID
            </label>
            <input
              id="input-sheet-id"
              type="text"
              className="field-input"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            />
            <span className="field-help">
              Reads <code>All Characters</code> and <code>Party by Region</code>
              . Set Share → <strong>Anyone with the link can view</strong> for
              1-click refresh even without an API key.{' '}
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--gold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                Open Sheet <ExternalLink size={11} />
              </a>
            </span>
          </div>

          <div className="field-group">
            <label htmlFor="input-sheets-key" className="field-label">
              Google Sheets API v4 Key (Optional — Read-Only)
            </label>
            <input
              id="input-sheets-key"
              type="password"
              className="field-input"
              value={sheetsApiKey}
              onChange={(e) => setSheetsApiKey(e.target.value)}
              placeholder="AIzaSy… (optional if Sheet is link-viewable)"
            />
            <span className="field-help">
              Stored locally in your browser (or via{' '}
              <code>VITE_GOOGLE_SHEETS_API_KEY</code>).
            </span>
          </div>

          {syncError && <div className="note-line danger">{syncError}</div>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              id="btn-modal-sync"
              type="button"
              className="btn-primary"
              disabled={isSyncing}
              onClick={() => onSaveAndSync(buildNextSettings())}
            >
              <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
              {isSyncing ? 'Refreshing…' : 'Refresh from Google Sheet Now'}
            </button>
            <button
              type="button"
              className="btn-subtle"
              onClick={onResetSnapshot}
            >
              <RotateCcw size={13} />
              Reset Snapshot
            </button>
          </div>

          <hr className="hairline" />

          {/* Keep Sheet Private? Paste rows directly from Sheets */}
          <div className="field-group">
            <label htmlFor="input-paste-roster" className="field-label">
              Keep Your Sheet Private? Quick Paste Update
            </label>
            <textarea
              id="input-paste-roster"
              className="field-input"
              rows={3}
              value={pastedRows}
              onChange={(e) => setPastedRows(e.target.value)}
              placeholder="Select all rows in your 'All Characters' tab (Ctrl/Cmd+A, Ctrl/Cmd+C) and paste here…"
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span className="field-help">
                Updates levels, constellations, and newly added characters immediately.
              </span>
              <button
                type="button"
                className="btn-subtle"
                disabled={!pastedRows.trim()}
                onClick={() => {
                  onImportPastedRoster(pastedRows);
                  setPastedRows('');
                }}
              >
                <ClipboardPaste size={13} />
                Apply Pasted Roster
              </button>
            </div>
          </div>

          <hr className="hairline" />

          <div className="field-group">
            <label htmlFor="input-gemini-key" className="field-label">
              Optional: Gemini API Key
            </label>
            <input
              id="input-gemini-key"
              type="password"
              className="field-input"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy… (optional for freeform boss queries)"
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingTop: 4,
            }}
          >
            <button type="button" className="ghost-action" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onSaveOnly(buildNextSettings());
                onClose();
              }}
            >
              <CheckCircle2 size={13} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
