// The floor plan in 3D: a ball-and-stick model of the molecule's VSEPR shape, tilted so depth shows. Lone pairs are
// faint lobes (they take up room but aren't part of the shape).
//   plan: { domains, lone }   center: the central element   outer: the outer elements (in any order)

const S3 = Math.sqrt(3) / 2
const POSITIONS = {
  2: [[1, 0, 0], [-1, 0, 0]],
  3: [[0, 1, 0], [-S3, -0.5, 0], [S3, -0.5, 0]],
  4: [[0, 1, 0], [0.943, -0.333, 0], [-0.471, -0.333, 0.816], [-0.471, -0.333, -0.816]],
  5: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, S3], [-0.5, 0, -S3]],
  6: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
}
// Which positions the lone pairs take (5 domains: equatorial first; 6: opposite each other)
const LONE = {
  '3,1': [0], '4,1': [0], '4,2': [0, 1], '5,1': [2], '5,2': [2, 3], '5,3': [2, 3, 4], '6,1': [2], '6,2': [2, 3],
}
const COLORS = { H: '#f8fafc', C: '#475569', N: '#3b82f6', O: '#ef4444', F: '#86efac', Cl: '#4ade80', Br: '#b45309', I: '#7c3aed', S: '#facc15', P: '#fb923c' }
const colorOf = (el) => COLORS[el] ?? '#94a3b8'

// Tilt: a little around y, then around x, so nothing hides behind the center
function project([x, y, z]) {
  const ay = 0.5, ax = 0.32
  const x1 = x * Math.cos(ay) + z * Math.sin(ay)
  const z1 = -x * Math.sin(ay) + z * Math.cos(ay)
  const y2 = y * Math.cos(ax) - z1 * Math.sin(ax)
  const z2 = y * Math.sin(ax) + z1 * Math.cos(ax)
  return { x: x1, y: -y2, z: z2 }
}

export default function Shape3D({ plan, center, outer = [], className = '', bg = 'transparent', label = true }) {
  if (!plan) return null
  const pos = POSITIONS[plan.domains]
  if (!pos) return null
  const lone = new Set(LONE[`${plan.domains},${plan.lone}`] ?? [])
  let k = 0
  const items = pos.map((p, i) => {
    const q = project(p)
    return lone.has(i) ? { kind: 'lone', ...q } : { kind: 'atom', el: outer[k++] ?? 'X', ...q }
  })
  const L = 34
  const order = [...items, { kind: 'center', x: 0, y: 0, z: 0 }].sort((a, b) => a.z - b.z)
  return (
    <svg viewBox="-56 -56 112 112" className={`block w-full ${className}`} role="img" aria-label="Ball-and-stick model of the shape">
      <rect x="-56" y="-56" width="112" height="112" rx="10" fill={bg} />
      {order.map((it, i) => {
        if (it.kind === 'center') return (
          <g key={i}>
            <circle cx="0" cy="0" r="11" fill={colorOf(center)} stroke="#0f172a" strokeWidth="1" />
            {label && <text x="0" y="3.5" textAnchor="middle" fontSize="9" fontWeight="800" fill={center === 'C' ? '#fff' : '#0f172a'}>{center}</text>}
          </g>
        )
        const x = it.x * L, y = it.y * L, r = 7.5 + it.z * 1.5
        const len = Math.hypot(x, y)
        const from = it.z > 0 && len > 0 ? 11 / len : 0 // a stick in front starts at the center ball's edge, so its label shows
        if (it.kind === 'lone') return (
          <ellipse key={i} cx={x * 0.62} cy={y * 0.62} rx={6 + it.z} ry={10 + it.z} fill="#c084fc" fillOpacity="0.35" stroke="#9333ea" strokeOpacity="0.7" strokeDasharray="2 2"
            transform={`rotate(${(Math.atan2(y, x) * 180) / Math.PI + 90} ${x * 0.62} ${y * 0.62})`} />
        )
        return (
          <g key={i}>
            <line x1={x * from} y1={y * from} x2={x} y2={y} stroke="#cbd5e1" strokeWidth={3 + it.z} strokeLinecap="round" />
            <circle cx={x} cy={y} r={r} fill={colorOf(it.el)} stroke="#0f172a" strokeWidth="0.8" />
            {label && <text x={x} y={y + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill={['C', 'I', 'N'].includes(it.el) ? '#fff' : '#0f172a'}>{it.el}</text>}
          </g>
        )
      })}
    </svg>
  )
}
