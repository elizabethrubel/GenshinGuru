import { ArrowUpRight, Compass, Sparkles, Swords, X } from 'lucide-react';
import { getArtifactGuide } from '../data/artifactGuides';
import { ENCOUNTERS } from '../data/encounters';
import type { Character, EncounterDefinition } from '../types/genshin';
import { CharacterPortrait } from './CharacterPortrait';
import { NationEmblem, PrimogemStar } from './NationEmblem';

interface CharacterBuildDrawerProps {
  character: Character;
  onClose: () => void;
  onBuildAroundCharacter: (char: Character) => void;
  onOpenBossCounter: (boss: EncounterDefinition) => void;
}

export function CharacterBuildDrawer({
  character,
  onClose,
  onBuildAroundCharacter,
  onOpenBossCounter,
}: CharacterBuildDrawerProps) {
  const guide = getArtifactGuide(character);

  // Find any Ascension Boss whose dropsFor list includes this character
  const ascensionBosses = ENCOUNTERS.filter((enc) =>
    enc.dropsFor?.some(
      (name) => name.toLowerCase() === character.name.toLowerCase()
    )
  );

  return (
    <div
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${character.name} build and artifact guide`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer-panel">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={`circle-node-ring el-${character.element}`}>
              <CharacterPortrait character={character} size={50} />
            </div>
            <div>
              <h3 className="drawer-title">{character.name}</h3>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                <span className={`el-text-${character.element}`}>
                  {character.element}
                </span>{' '}
                ✦ {character.weapon} ✦ Lv {character.level} ✦ {character.rarity}★
              </div>
            </div>
          </div>
          <button
            type="button"
            className="ghost-action"
            onClick={onClose}
            aria-label="Close build guide"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body" style={{ gap: 18 }}>
          {/* Cross-Link: Ascension Material Boss */}
          {ascensionBosses.length > 0 && (
            <>
              <div>
                <div
                  className="section-kicker"
                  style={{ color: 'var(--gold)' }}
                >
                  <Swords
                    size={12}
                    style={{ marginRight: 5, verticalAlign: -1 }}
                  />
                  Ascension Boss Matchup
                </div>
                {ascensionBosses.map((boss) => (
                  <button
                    key={boss.id}
                    type="button"
                    className="crosslink-row"
                    onClick={() => {
                      onClose();
                      onOpenBossCounter(boss);
                    }}
                  >
                    <span className="crosslink-row-left">
                      <NationEmblem
                        nation={boss.region}
                        size={16}
                        color="var(--gold-bright)"
                      />
                      <span>
                        <strong style={{ color: 'var(--text)' }}>
                          Farm {boss.name}
                        </strong>
                        <span
                          style={{
                            display: 'block',
                            fontSize: 12,
                            color: 'var(--text-3)',
                            marginTop: 1,
                          }}
                        >
                          Open your strongest counter team in Team Circle
                        </span>
                      </span>
                    </span>
                    <ArrowUpRight size={14} style={{ color: 'var(--gold-bright)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>

              <div className="filigree-divider" aria-hidden="true">
                <span />
                <PrimogemStar size={9} color="var(--gold)" />
                <span />
              </div>
            </>
          )}

          <div>
            <div className="section-kicker" style={{ color: 'var(--gold)' }}>
              <Sparkles
                size={12}
                style={{ marginRight: 5, verticalAlign: -1 }}
              />
              Best-in-Slot Artifact Set
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 6,
              }}
            >
              {guide.primarySet}
            </div>
            <p className="editorial-prose">{guide.note}</p>
          </div>

          <hr className="hairline" />

          <div>
            <div className="section-kicker">Strong Alternative</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-2)',
              }}
            >
              {guide.alternativeSet}
            </div>
          </div>

          <hr className="hairline" />

          <div>
            <div className="section-kicker">Ideal Main Stats</div>
            <div className="stat-spec-list">
              <div className="stat-spec-row">
                <span className="stat-spec-label">Sands</span>
                <span className="stat-spec-val">{guide.sands}</span>
              </div>
              <div className="stat-spec-row">
                <span className="stat-spec-label">Goblet</span>
                <span className="stat-spec-val">{guide.goblet}</span>
              </div>
              <div className="stat-spec-row">
                <span className="stat-spec-label">Circlet</span>
                <span className="stat-spec-val">{guide.circlet}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="section-kicker">Substat Priority</div>
            <div
              style={{
                fontSize: 13.5,
                color: 'var(--text-2)',
                fontWeight: 500,
              }}
            >
              {guide.substats}
            </div>
          </div>

          <hr className="hairline" />

          <div>
            <div className="section-kicker">Role &amp; Archetype</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {character.role} — {character.specialMechanic}
            </div>
            {character.constellations.length > 0 && (
              <div
                style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}
              >
                Unlocked Constellations (C{character.constellations.length}):{' '}
                {character.constellations.join(', ')}
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '10px 16px',
              }}
              onClick={() => {
                onClose();
                onBuildAroundCharacter(character);
              }}
            >
              <Compass size={14} />
              Build Team Circle Around {character.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
