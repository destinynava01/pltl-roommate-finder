// A Lewis structure drawn the way it's written on paper: the central atom (the landlord) in the middle, every outer
// atom around it, single, double or triple bonds as lines, lone pairs as dot pairs, an unpaired electron as one dot,
// and brackets with the charge for an ion.
//   mol:   { c, o: [elements], q }
//   s:     { b: [bond orders], l: [outer lone pairs], e: central nonbonding electrons }
//   mark:  the atom to highlight (-1 = the center, i = outer atom i)
//   counts: show how many electrons each atom has around it (the builder)
//   onBond(i), onAtom(i): taps (the builder); i = -1 is the center

const R = 46 // bond length
const ANGLES = {
  1: [0], 2: [180, 0], 3: [180, 0, 90], 4: [180, 0, 90, 270], 5: [90, 162, 234, 306, 18], 6: [0, 60, 120, 180, 240, 300],
}
const rad = (d) => (d * Math.PI) / 180
const at = (deg, r) => [Math.cos(rad(deg)) * r, -Math.sin(rad(deg)) * r]

// Two dots perpendicular to a direction (a lone pair), or one dot
function Dots({ x, y, deg, n = 2, color }) {
  const [dx, dy] = at(deg + 90, 3.2)
  return n === 2
    ? <g fill={color}><circle cx={x + dx} cy={y + dy} r="1.9" /><circle cx={x - dx} cy={y - dy} r="1.9" /></g>
    : <circle cx={x} cy={y} r="1.9" fill={color} />
}

export default function Lewis({ mol, s, mark = null, counts = false, onBond, onAtom, className = '', ink = '#1f2937', paper = '#fffdf7' }) {
  if (!mol || !s) return null
  const n = mol.o.length
  const angles = ANGLES[n] ?? ANGLES[6]
  const outer = mol.o.map((el, i) => ({ el, deg: angles[i], pos: at(angles[i], R) }))
  // The center's lone pairs go in the widest gaps between bonds
  // (greedy: the spot farthest from every bond and every lone pair already placed)
  const diff = (p, q) => Math.abs(((p - q + 540) % 360) - 180)
  const pairsC = Math.floor(s.e / 2)
  const singleC = s.e % 2
  const taken = angles.slice(0, n)
  const centerDots = []
  for (let k = 0; k < pairsC + singleC; k++) {
    let best = 0, gap = -1
    for (let deg = 0; deg < 360; deg += 15) {
      const g = Math.min(...taken.map((t) => diff(deg, t)), ...centerDots.map((d) => diff(deg, d.deg)))
      if (g > gap + 1e-9) { gap = g; best = deg }
    }
    centerDots.push({ deg: best, n: k < pairsC ? 2 : 1 })
  }
  const tap = (fn, i) => (fn ? { onClick: () => fn(i), style: { cursor: 'pointer' }, role: 'button' } : {})
  const around = (i) => (i < 0 ? 2 * s.b.reduce((a, b) => a + b, 0) + s.e : 2 * s.b[i] + 2 * s.l[i])
  const goal = (i) => (i >= 0 && mol.o[i] === 'H' ? 2 : 8)
  const pad = 86
  return (
    <svg viewBox={`${-pad} ${-pad} ${2 * pad} ${2 * pad}`} className={`block w-full ${className}`} role="img" aria-label={`Lewis structure of the molecule with ${mol.c} in the center`}>
      <rect x={-pad} y={-pad} width={2 * pad} height={2 * pad} rx="10" fill={paper} />
      {/* bonds */}
      {outer.map((o, i) => {
        const [x2, y2] = o.pos
        const [ox, oy] = at(o.deg + 90, 3.4)
        const from = at(o.deg, 10), to = at(o.deg, R - 10)
        const offsets = s.b[i] === 1 ? [0] : s.b[i] === 2 ? [-1, 1] : [-2, 0, 2]
        return (
          <g key={`b${i}`} {...tap(onBond, i)}>
            {onBond && <line x1={0} y1={0} x2={x2} y2={y2} stroke="transparent" strokeWidth="16" />}
            {offsets.map((k) => <line key={k} x1={from[0] + ox * k} y1={from[1] + oy * k} x2={to[0] + ox * k} y2={to[1] + oy * k} stroke={ink} strokeWidth="1.8" strokeLinecap="round" />)}
          </g>
        )
      })}
      {/* outer atoms and their lone pairs */}
      {outer.map((o, i) => {
        const [x, y] = o.pos
        const dirs = [o.deg, o.deg + 90, o.deg - 90, o.deg + 180].slice(0, 3)
        const order = s.l[i] === 1 ? [dirs[0]] : s.l[i] === 2 ? [dirs[1], dirs[2]] : dirs.slice(0, Math.min(3, s.l[i]))
        const ok = around(i) === goal(i)
        return (
          <g key={`o${i}`} {...tap(onAtom, i)}>
            <circle cx={x} cy={y} r="11" fill={mark === i ? '#fde68a' : paper} stroke={mark === i ? '#f59e0b' : 'transparent'} strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={ink} fontFamily="Inter, sans-serif">{o.el}</text>
            {order.map((d, k) => { const [dx, dy] = at(d, 13); return <Dots key={k} x={x + dx} y={y + dy} deg={d} color={ink} /> })}
            {counts && <text x={x + at(o.deg, 24)[0]} y={y + at(o.deg, 24)[1] + 3} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={ok ? '#059669' : '#dc2626'}>{around(i)}/{goal(i)}</text>}
          </g>
        )
      })}
      {/* the center */}
      <g {...tap(onAtom, -1)}>
        <circle cx={0} cy={0} r="11.5" fill={mark === -1 ? '#fde68a' : paper} stroke={mark === -1 ? '#f59e0b' : 'transparent'} strokeWidth="2" />
        <text x={0} y={4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill={ink} fontFamily="Inter, sans-serif">{mol.c}</text>
        {centerDots.map((d, k) => { const [dx, dy] = at(d.deg, 18); return <Dots key={k} x={dx} y={dy} deg={d.deg} n={d.n} color={ink} /> })}
        {counts && <text x={-pad + 6} y={-pad + 12} fontSize="7.5" fontWeight="700" fill="#475569">{mol.c}: {around(-1)} around it</text>}
      </g>
      {/* an ion's brackets and charge */}
      {mol.q !== 0 && (
        <g stroke={ink} strokeWidth="1.4" fill="none">
          <path d={`M${-pad + 14} ${-pad + 12} h-6 v${2 * pad - 24} h6`} />
          <path d={`M${pad - 14} ${-pad + 12} h6 v${2 * pad - 24} h-6`} />
          <text x={pad - 6} y={-pad + 10} fontSize="10" fontWeight="700" fill={ink} stroke="none" textAnchor="end">{Math.abs(mol.q) > 1 ? Math.abs(mol.q) : ''}{mol.q > 0 ? '+' : '−'}</text>
        </g>
      )}
    </svg>
  )
}
