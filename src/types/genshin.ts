export type ElementType =
  | 'Cryo'
  | 'Electro'
  | 'Pyro'
  | 'Geo'
  | 'Dendro'
  | 'Hydro'
  | 'Anemo';

export type WeaponType = 'Sword' | 'Polearm' | 'Bow' | 'Catalyst' | 'Claymore';

export type MechanicTag =
  | 'stellar-conduct'
  | 'stellar-glimmer'
  | 'lunar-charged'
  | 'lunar-bloom'
  | 'lunar-crystallize'
  | 'moonsign'
  | 'nightsoul'
  | 'arkhe-ousia'
  | 'hexerei'
  | 'overloaded-specialist'
  | 'standard';

export type SlotRole = 'Main DPS' | 'Sub-DPS' | 'Utility' | 'Healer';

export interface Character {
  id: string;
  name: string;
  level: number;
  element: ElementType;
  isHealer: boolean;
  isShielder: boolean;
  constellations: string[];
  constellationsRaw: string;
  rarity: 4 | 5;
  weapon: WeaponType;
  role: string;
  specialMechanic: string;
  mechanicTags: MechanicTag[];
  moonsignLevel: number; // 1 if Moonsign / Lunar Enabler, else 0
  isOnField: boolean;
  isOffField: boolean;
  isSupport: boolean;
  imageUrl?: string;
}

export interface RegionalPreset {
  id: string;
  region: string;
  teamName: string;
  slots: {
    mainDps: string;
    subDps: string;
    utility: string;
    healer: string;
  };
  resolvedCharacterIds: (string | null)[];
}

export interface ArchetypeDefinition {
  id: string;
  name: string;
  category: 'Stellar' | 'Lunar' | 'Elemental' | 'Specialist';
  summary: string;
  keyElements: ElementType[];
  requiredTags?: MechanicTag[];
  strictElementsOnly?: ElementType[];
  prefersMoonsign?: boolean;
  prefersStellar?: boolean;
  highlightNote: string;
}

export interface EncounterDefinition {
  id: string;
  name: string;
  region: string;
  category: 'Boss' | 'Shield & Mechanic' | 'Abyss / Domain' | 'Exploration';
  summary: string;
  tacticalTip: string;
  preferredArchetypes: string[];
  preferredElements: ElementType[];
  avoidElements?: ElementType[];
  requiredTags?: MechanicTag[];
  keywords: string[];
  matchedPresetRegion?: string;
}

export interface SynergyEdge {
  fromIndex: number;
  toIndex: number;
  label: string;
  kind: 'stellar' | 'lunar' | 'reaction' | 'resonance' | 'support';
  description: string;
}

export interface ReactionSummary {
  name: string;
  tier: 'stellar' | 'lunar' | 'standard';
  elements: ElementType[];
  description: string;
}

export interface ResonanceInfo {
  name: string;
  element: ElementType | 'Protective';
  effect: string;
}

export interface LevelingCallout {
  characterId: string;
  characterName: string;
  currentLevel: number;
  reason: string;
}

export interface TeamAnalysis {
  score: number;
  reactions: ReactionSummary[];
  resonances: ResonanceInfo[];
  moonsignTotal: number;
  moonsignTier: 'None' | 'Nascent Gleam' | 'Ascendant Gleam';
  stellarState: 'None' | 'Stellar-Conduct Active' | 'Stellar Swirl Active' | 'Stellar Ready (Needs Electro/Anemo)';
  hasHealer: boolean;
  hasShielder: boolean;
  survivability: 'Strong' | 'Covered' | 'Glass Cannon';
  chevreuseValid: boolean | null; // null if Chevreuse not in team
  edges: SynergyEdge[];
  warnings: string[];
  strengths: string[];
  levelingCallouts: LevelingCallout[];
  allBattleReady: boolean;
  minLevel: number;
}

export interface TeamRecommendation {
  id: string;
  title: string;
  subtitle: string;
  archetypeId?: string;
  encounterId?: string;
  members: [Character, Character, Character, Character];
  slotLabels: [SlotRole, SlotRole, SlotRole, SlotRole];
  analysis: TeamAnalysis;
  whyItWorks: string;
  source: 'engine' | 'preset' | 'gemini' | 'custom';
}

export interface BuilderFilters {
  archetypeId: string | null;
  encounterId: string | null;
  anchorCharacterId: string | null;
  includeUnbuilt: boolean;
  requireSurvivability: boolean;
  excludedCharacterIds: string[];
}

export interface SavedTeam {
  id: string;
  name: string;
  notes: string;
  regionTag: string;
  memberIds: [string, string, string, string];
  createdAt: string;
}

export interface SavedAbyssPair {
  id: string;
  name: string;
  half1Ids: [string | null, string | null, string | null, string | null];
  half2Ids: [string | null, string | null, string | null, string | null];
  half1Label: string;
  half2Label: string;
  createdAt: string;
}

export interface AppSettings {
  spreadsheetId: string;
  sheetsApiKey: string;
  geminiApiKey: string;
  lastSyncedAt: string | null;
  dataSource: 'snapshot' | 'live-sheets';
}

export type ActiveTab = 'visualizer' | 'abyss' | 'regions' | 'roster' | 'saved';
