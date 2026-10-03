/**
 * Advanced Dynamic SVG & Vector Thumbnail Generator with Pattern Engine & Custom Badges
 */

export interface ThumbnailConfig {
  title: string;
  category: string;
  colorA: string;
  colorB: string;
  pattern: 'grid' | 'circuit' | 'radial' | 'hex' | 'dots' | 'neon';
  icon: string;
  badge?: string;
  subtitle?: string;
}

export const CATEGORY_PALETTES: Record<string, { a: string; b: string; icon: string }> = {
  Action: { a: '#E11D48', b: '#881337', icon: 'sword' },
  Adventure: { a: '#059669', b: '#064E3B', icon: 'compass' },
  Arcade: { a: '#7C3AED', b: '#4C1D95', icon: 'gamepad' },
  Racing: { a: '#D97706', b: '#78350F', icon: 'car' },
  Puzzle: { a: '#2563EB', b: '#1E3A8A', icon: 'puzzle' },
  Sports: { a: '#16A34A', b: '#14532D', icon: 'trophy' },
  'Match 3': { a: '#EC4899', b: '#831843', icon: 'gem' },
  Cooking: { a: '#F97316', b: '#7C2D12', icon: 'utensils' },
  Girls: { a: '#F43F5E', b: '#881337', icon: 'sparkles' },
  Card: { a: '#0284C7', b: '#082F49', icon: 'club' },
  Board: { a: '#9333EA', b: '#3B0764', icon: 'dice' },
  Shooting: { a: '#DC2626', b: '#450A0A', icon: 'target' },
  'Hyper Casual': { a: '#8B5CF6', b: '#2E1065', icon: 'zap' },
  Word: { a: '#0891B2', b: '#164E63', icon: 'book' },
};

function getIconSvg(icon: string): string {
  switch (icon) {
    case 'car':
      return `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.8 2 12.4V16c0 .6.4 1 1 1h2m0 0a2 2 0 1 0 4 0m10 0a2 2 0 1 0 4 0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'gem':
      return `<polygon points="6 3 18 3 22 9 12 21 2 9 6 3" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'trophy':
      return `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34M18 4H6v6a6 6 0 0 0 12 0V4z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'puzzle':
      return `<path d="M19 11h-3a2 2 0 0 1-2-2V6a2 2 0 0 0-4 0v3a2 2 0 0 1-2 2H5a2 2 0 0 0 0 4h3a2 2 0 0 1 2 2v3a2 2 0 0 0 4 0v-3a2 2 0 0 1 2-2h3a2 2 0 0 0 0-4z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'target':
      return `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/>`;
    case 'zap':
      return `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="currentColor"/>`;
    case 'sparkles':
      return `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'utensils':
      return `<path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 11v11M4 2v20M8 2v4a2 2 0 0 1-2 2 2 2 0 0 1-2-2V2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'sword':
      return `<path d="m14.5 17.5 3 3M13 19l6 2 2-6-2-2M14.5 4.5 4 15l2 2 10.5-10.5-2-2z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    case 'compass':
      return `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" fill="none"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor"/>`;
    default:
      return `<rect x="2" y="6" width="20" height="12" rx="4" stroke="currentColor" stroke-width="2.5" fill="none"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="8" y1="10" x2="8" y2="14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="10" r="1" fill="currentColor"/><circle cx="18" cy="13" r="1" fill="currentColor"/>`;
  }
}

function getPatternDef(pattern: string): string {
  switch (pattern) {
    case 'circuit':
      return `<pattern id="pat" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M10 10h20v20H10z M0 20h10 M30 20h10 M20 0v10 M20 30v10" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/><circle cx="20" cy="20" r="2.5" fill="rgba(255,255,255,0.2)"/></pattern>`;
    case 'hex':
      return `<pattern id="pat" width="30" height="52" patternUnits="userSpaceOnUse"><path d="M15 0l15 8.7v17.3L15 34.6 0 26V8.7zM0 52l15-8.7 15 8.7" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/></pattern>`;
    case 'dots':
      return `<pattern id="pat" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.12)"/></pattern>`;
    case 'neon':
      return `<pattern id="pat" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M0 30 Q15 0 30 30 T60 30" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/></pattern>`;
    case 'grid':
    default:
      return `<pattern id="pat" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/></pattern>`;
  }
}

export function buildCustomThumbnailSvg(config: ThumbnailConfig): string {
  const safeTitle = config.title.length > 22 ? config.title.substring(0, 20) + '…' : config.title;
  const patternDef = getPatternDef(config.pattern);

  const badgeElement = config.badge
    ? `
    <g transform="translate(320, 20)">
      <rect x="-35" y="0" width="70" height="24" rx="12" fill="#ef4444" filter="drop-shadow(0 2px 5px rgba(239,68,68,0.5))"/>
      <text x="0" y="16" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#ffffff" letter-spacing="1">
        ${config.badge.toUpperCase()}
      </text>
    </g>`
    : '';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.colorA}" />
      <stop offset="100%" stop-color="${config.colorB}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.65" />
    </radialGradient>
    ${patternDef}
  </defs>

  <rect width="400" height="300" fill="url(#grad)" />
  <rect width="400" height="300" fill="url(#pat)" />
  <rect width="400" height="300" fill="url(#glow)" />

  <circle cx="200" cy="115" r="74" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="6 6"/>
  <circle cx="200" cy="115" r="54" fill="rgba(255,255,255,0.12)" />

  <g transform="translate(176, 91) scale(2)" color="#ffffff">
    ${getIconSvg(config.icon)}
  </g>

  ${badgeElement}

  <text x="200" y="215" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" fill="rgba(255,255,255,0.8)" letter-spacing="2">
    ${config.category.toUpperCase()}
  </text>

  <text x="200" y="248" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="20" font-weight="800" fill="#ffffff" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))">
    ${safeTitle.replace(/&/g, '&amp;')}
  </text>

  <g transform="translate(186, 264) scale(0.65)" color="#ffffff" opacity="0.85">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
  </g>
</svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateGameThumbnail(title: string, category: string): string {
  const p = CATEGORY_PALETTES[category] || { a: '#6366F1', b: '#1E1B4B', icon: 'gamepad' };
  return buildCustomThumbnailSvg({
    title,
    category,
    colorA: p.a,
    colorB: p.b,
    pattern: 'grid',
    icon: p.icon,
    badge: title.toLowerCase().includes('3d') ? '3D' : undefined,
  });
}
