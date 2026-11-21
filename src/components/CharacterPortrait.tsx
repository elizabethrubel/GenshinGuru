import { useEffect, useState } from 'react';
import type { Character } from '../types/genshin';
import { getCharacterPortrait } from '../data/characterPortraits';
import { ElementIcon } from './ElementIcon';

interface CharacterPortraitProps {
  character: Character;
  size?: number;
}

export function CharacterPortrait({
  character,
  size = 64,
}: CharacterPortraitProps) {
  const presetAsset = getCharacterPortrait(character.id);
  const src = character.imageUrl ?? presetAsset?.url;
  const objectPosition = presetAsset?.objectPosition ?? 'center center';
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  return (
    <div
      className="portrait-img-wrap"
      style={{ width: size, height: size }}
    >
      {src && !imgFailed ? (
        <img
          src={src}
          alt={character.name}
          className="portrait-img"
          style={{ objectPosition }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <ElementIcon
          element={character.element}
          size={Math.round(size * 0.48)}
        />
      )}
    </div>
  );
}
