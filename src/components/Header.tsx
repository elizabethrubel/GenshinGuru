import { Bookmark, RefreshCw, Settings, Sparkles } from 'lucide-react';
import type { ActiveTab, AppSettings } from '../types/genshin';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  savedCount: number;
  settings: AppSettings;
  isSyncing: boolean;
  onSyncNow: () => void;
  onOpenSettings: () => void;
  onOpenSavedDrawer: () => void;
}

export function Header({
  activeTab,
  onSelectTab,
  savedCount,
  settings,
  isSyncing,
  onSyncNow,
  onOpenSettings,
  onOpenSavedDrawer,
}: HeaderProps) {
  const isLive = settings.dataSource === 'live-sheets';

  return (
    <header className="app-header">
      <div className="header-inner">
        <button
          type="button"
          className="brand-mark"
          onClick={() => onSelectTab('visualizer')}
        >
          <span className="brand-dot" aria-hidden="true">
            <Sparkles size={13} />
          </span>
          <h1 className="brand-name">Genshin Guru</h1>
        </button>

        <nav className="nav-links" aria-label="Primary navigation">
          <button
            id="nav-visualizer"
            type="button"
            className={`nav-link ${activeTab === 'visualizer' ? 'active' : ''}`}
            onClick={() => onSelectTab('visualizer')}
          >
            Team Circle
          </button>

          <button
            id="nav-abyss"
            type="button"
            className={`nav-link ${activeTab === 'abyss' ? 'active' : ''}`}
            onClick={() => onSelectTab('abyss')}
          >
            Spiral Abyss
          </button>

          <button
            id="nav-regions"
            type="button"
            className={`nav-link ${activeTab === 'regions' ? 'active' : ''}`}
            onClick={() => onSelectTab('regions')}
          >
            Regions
          </button>

          <button
            id="nav-roster"
            type="button"
            className={`nav-link ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => onSelectTab('roster')}
          >
            Roster
          </button>
        </nav>

        <div className="header-tools">
          <button
            id="btn-open-saved"
            type="button"
            className="ghost-action"
            onClick={onOpenSavedDrawer}
          >
            <Bookmark size={14} />
            <span>Saved{savedCount > 0 ? ` (${savedCount})` : ''}</span>
          </button>

          <button
            id="btn-sync-sheet"
            type="button"
            className="ghost-action"
            onClick={settings.sheetsApiKey ? onSyncNow : onOpenSettings}
            title={
              settings.sheetsApiKey
                ? 'Sync latest roster from Google Sheets'
                : 'Connect Google Sheets API v4'
            }
          >
            <span className={`sync-dot ${isLive ? 'live' : ''}`} />
            <span>{isSyncing ? 'Syncing…' : isLive ? 'Live' : 'Snapshot'}</span>
            <RefreshCw size={13} />
          </button>

          <button
            id="btn-open-settings"
            type="button"
            className="ghost-action"
            onClick={onOpenSettings}
            aria-label="Sync and API settings"
            title="Sync & API Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
