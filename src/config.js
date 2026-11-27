// Change these to rebrand the game.
export const SITE_NAME = 'Roommate Finder'
export const SITE_TAGLINE = 'Lewis Lab: every atom needs a bed at the Octet Arms.'
export const HUB_URL = 'https://pltl-game-hub.vercel.app'

export const MIN_TEAMS = 1
export const MAX_TEAMS = 8
// Team colors (the same order the server uses)
export const TEAM_COLORS = ['#22d3ee', '#f472b6', '#a3e635', '#fbbf24', '#a78bfa', '#fb923c', '#34d399', '#60a5fa']
export const DURATIONS = [null, 20, 30, 45] // minutes (null: no clock)

// The rounds, in play order (the same ids the server uses)
export const ROUNDS = [
  { id: 'deposit', title: 'The deposit', emoji: '💰', what: 'Total valence electrons, ions included', steps: 3 },
  { id: 'movein', title: 'Move-in day', emoji: '🛏️', what: 'Build the Lewis structure', steps: 3 },
  { id: 'rules', title: 'House rules', emoji: '📋', what: 'Formal charge, the better structure, resonance and octet exceptions', steps: 3 },
  { id: 'floor', title: 'Floor plan', emoji: '📐', what: 'VSEPR: electron-domain geometry, molecular shape and bond angle', steps: 3 },
  { id: 'hog', title: 'Blanket hog', emoji: '🤝', what: 'Electronegativity and bond polarity (nonpolar, polar, ionic)', steps: 3, optional: true },
]
export const roundOf = (id) => ROUNDS.find((r) => r.id === id)

// mm:ss left on the clock
export function clockText(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Answers as one line of text (the peek's list of tries). cur is the step the phones see (its fields).
export function describeAnswer(cur, a = {}) {
  if (!cur) return ''
  if (cur.kind === 'number') return String(a.number ?? '')
  if (cur.kind === 'pick') {
    return (cur.fields ?? []).map((f) => `${cur.fields.length > 1 ? `${f.label}: ` : ''}${f.choices.find((c) => c.id === a.picks?.[f.key])?.text ?? '?'}`).join(' · ')
  }
  if (cur.kind === 'build' && cur.mol) {
    const BOND = ['', '–', '=', '≡']
    const outer = cur.mol.o.map((el, i) => `${BOND[a.bonds?.[i]] ?? '?'}${el}${a.lone?.[i] ? ` (${a.lone[i]} lp)` : ''}`).join(', ')
    return `${cur.mol.c}: ${outer}; center ${a.center ?? 0} lone e⁻`
  }
  return JSON.stringify(a)
}
