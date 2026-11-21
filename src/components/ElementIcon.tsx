import type { ElementType } from '../types/genshin';

interface ElementIconProps {
  element: ElementType;
  size?: number;
  className?: string;
}

export function ElementIcon({
  element,
  size = 18,
  className = '',
}: ElementIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    className: `el-text-${element} ${className}`.trim(),
    'aria-hidden': true as const,
  };

  switch (element) {
    case 'Cryo':
      return (
        <svg {...common}>
          <path
            d="M12 2v20M3.34 7l17.32 10M20.66 7L3.34 17"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <polygon
            points="12,7.5 15.9,9.75 15.9,14.25 12,16.5 8.1,14.25 8.1,9.75"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'Electro':
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
          <path
            d="M13.5 3.5L6.8 13h5l-1.3 7.5L17.2 11h-5l1.3-7.5z"
            fill="currentColor"
            fillOpacity="0.85"
          />
        </svg>
      );
    case 'Pyro':
      return (
        <svg {...common}>
          <path
            d="M12.4 2.5c.8 3.6-2.4 5.2-2.4 8.2 0 1.3.9 2.2 2 2.2 1.4 0 2.3-1.2 2.2-3 2.5 1.7 4.3 4.3 4.3 7.1A6.5 6.5 0 0 1 12 22a6.5 6.5 0 0 1-6.5-6.5c0-4.3 3.2-7.8 6.9-13z"
            fill="currentColor"
            fillOpacity="0.24"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'Geo':
      return (
        <svg {...common}>
          <polygon
            points="12,2.5 20.5,12 12,21.5 3.5,12"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <polygon
            points="12,7.2 16.2,12 12,16.8 7.8,12"
            fill="currentColor"
          />
        </svg>
      );
    case 'Dendro':
      return (
        <svg {...common}>
          <path
            d="M19.5 4.5C12.5 4.5 6 8.8 5.2 17.8c-.1 1 .8 1.8 1.8 1.7 9-.8 13.3-7.3 12.5-15z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 18.5C9.5 14.5 13 11.5 17.5 8.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'Hydro':
      return (
        <svg {...common}>
          <path
            d="M12 2.8C12 2.8 5.5 10 5.5 14.7a6.5 6.5 0 0 0 13 0C18.5 10 12 2.8 12 2.8z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9.3 15.2a2.8 2.8 0 0 0 3.2 2.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'Anemo':
      return (
        <svg {...common}>
          <path
            d="M4 9.5h10.5a2.8 2.8 0 1 0-2.8-2.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M3 14h14.5a3 3 0 1 1-3 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6 18h4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
