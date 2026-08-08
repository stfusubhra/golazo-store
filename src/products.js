// ---------------------------------------------------------------------------
// GOLAZO STORE — classic football catalog
// Four takes on the iconic 32-panel match ball (12 pentagons + 20 hexagons).
// Each product only recolors the panels — the real geometry is shared.
// ---------------------------------------------------------------------------

// Panel colors (hexagons) and pentagon colors (the dark/colored inserts).
export const BASE_COLORS = ['#F7F4EA', '#1E1E24', '#E63946', '#2A9D8F', '#1D3557', '#FFC300']

export const LINE_COLORS = [
  '#141414',
  '#E63946',
  '#2A9D8F',
  '#1D3557',
  '#FFC300',
  '#F4A261',
  '#FFFFFF',
]

export const PRODUCTS = [
  {
    id: 1,
    namePart1: 'TEL',
    namePart2: 'STAR',
    model: 'TELSTAR 70',
    category: 'THE CLASSIC · 32-PANEL MATCH BALL',
    price: 89.99,
    size: '5',
    badge: '70/70',
    primaryColor: '#F7F4EA', // ivory panels
    lineColor: '#141414', // black pentagons
    accentColor: '#FFC300',
    bgColor: '#EFEFEF', // soft off-white outer frame + glow for the classic
    specs: [
      ['CONSTRUCTION', '32-Panel Truncated Icosahedron'],
      ['PANELS', '12 Pentagons · 20 Hexagons'],
      ['SURFACE', 'High-Tack Pebbled Leather'],
      ['LEGACY', 'Estadio Azteca · 1970'],
    ],
    story:
      'The one that started it all. Twelve black pentagons stitched into twenty white hexagons — the silhouette that defined football for fifty years. Deep seams, true flight, zero gimmicks.',
  },
  {
    id: 2,
    namePart1: 'TAN',
    namePart2: 'GO',
    model: 'TANGO 78',
    category: 'TRIBUTE · THE RIVER PLATE CLASSIC',
    price: 79.99,
    size: '5',
    badge: '78/78',
    primaryColor: '#FDFDFB', // clean white panels
    lineColor: '#C8102E', // red pentagons
    accentColor: '#E63946',
    bgColor: '#631A24', // deep crimson outer frame + glow
    specs: [
      ['CONSTRUCTION', '32-Panel Truncated Icosahedron'],
      ['PANELS', 'Red Pentagon Inserts'],
      ['SURFACE', 'Match-Day Leather Grain'],
      ['LEGACY', 'Buenos Aires · 1978'],
    ],
    story:
      'A tribute to the golden era of the game. Clean white panels cut by deep red pentagons — simple, loud, and instantly recognizable from the stands.',
  },
  {
    id: 3,
    namePart1: 'ROY',
    namePart2: 'AL',
    model: 'ROYAL 82',
    category: 'PREMIUM · GOLD SERIES',
    price: 99.99,
    size: '5',
    badge: '82/82',
    primaryColor: '#F7F4EA', // ivory panels
    lineColor: '#D4A017', // gold pentagons
    accentColor: '#D4A017',
    bgColor: '#4C390F', // dark bronze outer frame + glow
    specs: [
      ['CONSTRUCTION', '32-Panel Truncated Icosahedron'],
      ['PANELS', 'Gold Pentagon Inserts'],
      ['SURFACE', 'Premium Pebbled Calf'],
      ['LIMIT', 'Numbered Edition'],
    ],
    story:
      'The trophy-ball. Ivory panels meet gold inserts in a limited, numbered edition — built for collectors and the biggest stages on earth.',
  },
  {
    id: 4,
    namePart1: 'NO',
    namePart2: 'IR',
    model: 'NOIR 26',
    category: 'BLACKOUT · NIGHT MATCH BALL',
    price: 69.99,
    size: '5',
    badge: '26/26',
    primaryColor: '#1E1E24', // charcoal panels
    lineColor: '#F7F4EA', // bone-white pentagons
    accentColor: '#F7F4EA',
    bgColor: '#2E2E38', // slate-charcoal outer frame + glow
    specs: [
      ['CONSTRUCTION', '32-Panel Truncated Icosahedron'],
      ['PANELS', 'Reverse-Contrast Inserts'],
      ['SURFACE', 'Matte Night Leather'],
      ['USE', 'Floodlit Match / Training'],
    ],
    story:
      'Made for the floodlights. Charcoal panels and bone-white inserts disappear into the night sky and reappear the moment the ball leaves your foot.',
  },
]
