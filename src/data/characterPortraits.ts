import { PORTRAIT_DATA_URIS } from './portraitDataUris';

export interface PortraitAsset {
  url: string;
  objectPosition?: string;
}

/**
 * Inlined 144x144 optimized WebP icons sourced from
 * https://genshin-impact.fandom.com/wiki/Character/List
 * Eliminates 34 separate network requests for zero-latency portrait rendering.
 */
export const CHARACTER_PORTRAITS: Record<string, PortraitAsset> =
  Object.fromEntries(
    Object.entries(PORTRAIT_DATA_URIS).map(([id, dataUri]) => [
      id,
      {
        url: dataUri,
        objectPosition: 'center center',
      },
    ])
  );

export function getCharacterPortrait(id: string): PortraitAsset | undefined {
  return CHARACTER_PORTRAITS[id];
}
