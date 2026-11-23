interface PrimogemStarProps {
  size?: number;
  className?: string;
  color?: string;
}

/** Genshin Impact's signature 4-point concave Primogem / Constellation star */
export function PrimogemStar({
  size = 14,
  className = '',
  color = 'currentColor',
}: PrimogemStarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 1.5L14.45 9.55L22.5 12L14.45 14.45L12 22.5L9.55 14.45L1.5 12L9.55 9.55L12 1.5Z"
        fill={color}
      />
    </svg>
  );
}

interface NationEmblemProps {
  nation: string;
  size?: number;
  color?: string;
  className?: string;
}

/** Refined minimalist geometric crests evoking each Teyvat Nation & Stygian 7.2 */
export function NationEmblem({
  nation,
  size = 15,
  color = 'currentColor',
  className = '',
}: NationEmblemProps) {
  const key = nation.toLowerCase();

  if (key.includes('snezhnaya')) {
    // 6-point Cryo frost star
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M12 2V22M3.34 7L20.66 17M20.66 7L3.34 17"
          stroke={color}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <polygon
          points="12,7 16.3,9.5 16.3,14.5 12,17 7.7,14.5 7.7,9.5"
          stroke={color}
          strokeWidth="1.4"
          fill={color}
          fillOpacity="0.16"
        />
      </svg>
    );
  }

  if (key.includes('nod-krai') || key.includes('hiisi')) {
    // Lunar crescent + guiding star
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M15.8 4.4A8.2 8.2 0 1 0 19.6 16.2A6.5 6.5 0 1 1 15.8 4.4Z"
          fill={color}
          fillOpacity="0.22"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M17.5 6.5L18.3 8.8L20.6 9.6L18.3 10.4L17.5 12.7L16.7 10.4L14.4 9.6L16.7 8.8L17.5 6.5Z"
          fill={color}
        />
      </svg>
    );
  }

  if (key.includes('fontaine')) {
    // Hydro teardrop & justice crest
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M12 3C12 3 6.5 10.2 6.5 14.5C6.5 17.8 8.95 20.5 12 20.5C15.05 20.5 17.5 17.8 17.5 14.5C17.5 10.2 12 3 12 3Z"
          fill={color}
          fillOpacity="0.18"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 10.5L13.6 14.5L12 17L10.4 14.5L12 10.5Z"
          fill={color}
        />
      </svg>
    );
  }

  if (key.includes('natlan')) {
    // Solar Pyro flame crest
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M12 2.5C14.8 6.4 18 9.2 18 13.8C18 17.4 15.3 20.5 12 20.5C8.7 20.5 6 17.4 6 13.8C6 11.4 7.2 9.2 8.7 7.4C8.9 9.5 10 10.5 10.8 10.5C10.4 7.7 10.9 4.8 12 2.5Z"
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (key.includes('liyue')) {
    // Faceted Geo diamond lozenge
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M12 2.5L20 12L12 21.5L4 12L12 2.5Z"
          fill={color}
          fillOpacity="0.18"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 7.5L15.6 12L12 16.5L8.4 12L12 7.5Z"
          fill={color}
        />
      </svg>
    );
  }

  if (key.includes('inazuma')) {
    // Electro lightning diamond
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.55"
        />
        <path
          d="M13.2 4.8L7.6 12.7H12L10.8 19.2L16.4 11.3H12L13.2 4.8Z"
          fill={color}
        />
      </svg>
    );
  }

  if (key.includes('sumeru')) {
    // Dendro wisdom leaf
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M12 3C7.2 6.4 5.5 11.2 6.8 15.8C7.8 19 10.1 20.5 12 21C13.9 20.5 16.2 19 17.2 15.8C18.5 11.2 16.8 6.4 12 3Z"
          fill={color}
          fillOpacity="0.18"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 7V19"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (key.includes('mondstadt')) {
    // Anemo windrose / wing
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M12 3L14.6 9.4L21 12L14.6 14.6L12 21L9.4 14.6L3 12L9.4 9.4L12 3Z"
          fill={color}
          fillOpacity="0.18"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.2" fill={color} />
      </svg>
    );
  }

  // Default / Stygian 7.2 / Weekly: Celestial Primogem Star
  return <PrimogemStar size={size} color={color} className={className} />;
}
