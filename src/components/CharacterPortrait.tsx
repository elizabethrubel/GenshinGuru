import { useEffect, useRef, useState } from 'react';
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
  const isDataUri = Boolean(src?.startsWith('data:'));

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(isDataUri);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    if (src?.startsWith('data:')) {
      setLoaded(true);
    } else if (
      imgRef.current &&
      imgRef.current.complete &&
      imgRef.current.naturalWidth > 0
    ) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <div
      className="portrait-img-wrap"
      style={{ width: size, height: size }}
    >
      {/* Always render the character's Elemental Sign underneath as an instant fallback while loading or on error */}
      <span
        className="portrait-sign-fallback"
        style={{ opacity: loaded && !imgFailed ? 0 : 1 }}
        aria-hidden="true"
      >
        <ElementIcon
          element={character.element}
          size={Math.round(size * 0.48)}
        />
      </span>

      {src && !imgFailed && (
        <img
          ref={imgRef}
          src={src}
          alt={character.name}
          className="portrait-img"
          decoding="async"
          referrerPolicy="no-referrer"
          style={{
            objectPosition,
            opacity: loaded ? 1 : 0,
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setImgFailed(true);
            setLoaded(false);
          }}
        />
      )}
    </div>
  );
}
