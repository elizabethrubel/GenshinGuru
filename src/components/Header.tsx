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
            id="nav-bosses"
            type="button"
            className={`nav-link ${activeTab === 'bosses' ? 'active' : ''}`}
            onClick={() => onSelectTab('bosses')}
          >
            Bosses
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
            id="btn-refresh-roster"
            type="button"
            className="btn-subtle"
            disabled={isSyncing}
            onClick={onSyncNow}
            title={
              settings.lastSyncedAt
                ? `Last refreshed ${new Date(settings.lastSyncedAt).toLocaleTimeString()} — click to re-sync from Google Sheets`
                : 'Pull latest character levels and teams from your Google Sheet'
            }
          >
            <span className={`sync-dot ${isLive ? 'live' : ''}`} />
            <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Refreshing…' : 'Refresh Roster'}</span>
          </button>

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
            id="btn-open-settings"
            type="button"
            className="ghost-action"
            onClick={onOpenSettings}
            aria-label="Sync and API settings"
            title="Sheet Sync & API Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
