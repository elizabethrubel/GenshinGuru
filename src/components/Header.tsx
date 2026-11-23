import { Bookmark, Settings } from 'lucide-react';
import type { ActiveTab } from '../types/genshin';
import { PrimogemStar } from './NationEmblem';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  savedCount: number;
  includeUnbuilt: boolean;
  onToggleIncludeUnbuilt: () => void;
  onOpenSettings: () => void;
  onOpenSavedDrawer: () => void;
}

export function Header({
  activeTab,
  onSelectTab,
  savedCount,
  includeUnbuilt,
  onToggleIncludeUnbuilt,
  onOpenSettings,
  onOpenSavedDrawer,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <button
          type="button"
          className="brand-mark"
          onClick={() => onSelectTab('visualizer')}
        >
          <span className="brand-dot" aria-hidden="true">
            <PrimogemStar size={14} />
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
          {/* Unified global Battle-Ready vs Full Roster toggle across all tabs */}
          <button
            id="btn-global-readiness"
            type="button"
            className={`readiness-pill ${includeUnbuilt ? 'all-levels' : ''}`}
            onClick={onToggleIncludeUnbuilt}
            title={
              includeUnbuilt
                ? 'Showing all owned characters (Lv 1–90) across Team Circle, Bosses, and Abyss — click to restrict to Lv 70+'
                : 'Showing Battle-Ready characters (Lv 70+) across Team Circle, Bosses, and Abyss — click to include unbuilt characters'
            }
          >
            <span className="readiness-dot" aria-hidden="true" />
            <span>{includeUnbuilt ? 'Pool: Lv 1–90' : 'Pool: Lv 70+'}</span>
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
