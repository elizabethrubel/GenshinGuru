import { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import type { AppSettings } from '../types/genshin';
import { DEFAULT_SPREADSHEET_ID } from '../services/sheetsApi';

interface SettingsModalProps {
  settings: AppSettings;
  isSyncing: boolean;
  syncError: string | null;
  onSaveAndSync: (nextSettings: AppSettings) => Promise<void>;
  onSaveOnly: (nextSettings: AppSettings) => void;
  onResetSnapshot: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  isSyncing,
  syncError,
  onSaveAndSync,
  onSaveOnly,
  onResetSnapshot,
  onClose,
}: SettingsModalProps) {
  const [spreadsheetId, setSpreadsheetId] = useState(
    settings.spreadsheetId || DEFAULT_SPREADSHEET_ID
  );
  const [sheetsApiKey, setSheetsApiKey] = useState(settings.sheetsApiKey);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);

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
            <h3 className="drawer-title">Sync &amp; API Settings</h3>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {settings.dataSource === 'live-sheets' && settings.lastSyncedAt
                ? `Live synced ${new Date(settings.lastSyncedAt).toLocaleString()}`
                : 'Using bundled snapshot of your 34 characters & 17 regional teams'}
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
              .{' '}
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
              Google Sheets API v4 Key (Read-Only)
            </label>
            <input
              id="input-sheets-key"
              type="password"
              className="field-input"
              value={sheetsApiKey}
              onChange={(e) => setSheetsApiKey(e.target.value)}
              placeholder="AIzaSy…"
            />
            <span className="field-help">
              Stored locally in your browser (or via{' '}
              <code>VITE_GOOGLE_SHEETS_API_KEY</code>). Sheet must be set to
              &quot;Anyone with the link can view&quot;.
            </span>
          </div>

          {syncError && <div className="note-line danger">{syncError}</div>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              id="btn-modal-sync"
              type="button"
              className="btn-primary"
              disabled={isSyncing || !sheetsApiKey.trim()}
              onClick={() => onSaveAndSync(buildNextSettings())}
            >
              <RefreshCw size={13} />
              {isSyncing ? 'Syncing…' : 'Save & Sync Live Sheet'}
            </button>
            <button
              type="button"
              className="btn-subtle"
              onClick={onResetSnapshot}
            >
              <RotateCcw size={13} />
              Use Snapshot
            </button>
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
            <span className="field-help">
              Lets you type any open-ended &quot;fight xyz&quot; question in the
              top bar and render Gemini&apos;s pick directly inside the Team
              Circle.
            </span>
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
