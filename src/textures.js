// ---------------------------------------------------------------------------
// Small color helpers used across the store.
// ---------------------------------------------------------------------------

export function shade(hex, amt) {
  // amt in [-1, 1]: negative darkens, positive lightens
  const n = parseInt(hex.replace('#', ''), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  if (amt >= 0) {
    r = r + (255 - r) * amt
    g = g + (255 - g) * amt
    b = b + (255 - b) * amt
  } else {
    r = r * (1 + amt)
    g = g * (1 + amt)
    b = b * (1 + amt)
  }
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`
}

export function darken(hex, f) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = ((n >> 16) & 255) * f
  const g = ((n >> 8) & 255) * f
  const b = (n & 255) * f
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`
}
