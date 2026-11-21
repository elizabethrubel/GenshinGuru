export interface PortraitAsset {
  url: string;
  objectPosition?: string;
}

const PORTRAIT_IDS = [
  'traveller',
  'fischl',
  'bennett',
  'zibai',
  'flins',
  'lauma',
  'kaeya',
  'lisa',
  'barbara',
  'xiangling',
  'yumemizuki-mizuki',
  'noelle',
  'sucrose',
  'aino',
  'dehya',
  'candace',
  'jahoda',
  'kaveh',
  'kachina',
  'lan-yan',
  'amber',
  'collei',
  'lynette',
  'baizhu',
  'mona',
  'prune',
  'diona',
  'alyosha',
  'kujou-sara',
  'yaoyao',
  'gaming',
  'chevreuse',
  'thoma',
  'xinyan',
] as const;

/**
 * Local character icons sourced from https://genshin-impact.fandom.com/wiki/Character/List
 * and bundled in public/portraits/ so they load instantaneously with zero external blocking.
 */
export const CHARACTER_PORTRAITS: Record<string, PortraitAsset> =
  Object.fromEntries(
    PORTRAIT_IDS.map((id) => [
      id,
      {
        url: `/portraits/${id}.webp`,
        objectPosition: 'center center',
      },
    ])
  );

export function getCharacterPortrait(id: string): PortraitAsset | undefined {
  return CHARACTER_PORTRAITS[id];
}
