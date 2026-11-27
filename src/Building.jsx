// The Octet Arms: one building per team on a night street. Every right answer adds a lit floor with its tenant's name
// on the window sign; the floors still to come are scaffolding. A neon sign says VACANCY until the team finishes.
//   teams: [{ name, color, floors: [tenant], total, applicant?, finished? }]
import { useId } from 'react'

const W = 200
const H = 300
const GROUND = 272

export default function Building({ teams, labels = true, className = '' }) {
  const id = useId().replace(/:/g, '')
  const width = W * Math.max(1, teams.length)
  return (
    <svg viewBox={`0 0 ${width} ${H}`} className={`mx-auto block w-full rounded-xl ${className}`} style={{ maxWidth: `${teams.length * 20}rem` }} role="img" aria-label="The Octet Arms apartments">
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1026" /><stop offset="1" stopColor="#312e81" />
        </linearGradient>
      </defs>
      <rect width={width} height={H} fill={`url(#${id}sky)`} />
      {Array.from({ length: Math.round(width / 9) }, (_, i) => (
        <circle key={i} cx={(i * 97) % width} cy={(i * 53) % 120} r={i % 3 ? 0.6 : 1} fill="#fff" opacity="0.6" />
      ))}
      <rect y={GROUND} width={width} height={H - GROUND} fill="#1e1b2e" />
      <rect y={GROUND} width={width} height="3" fill="#3f3a5a" />
      {teams.map((t, i) => <Tower key={i} x={i * W} team={t} labels={labels} divider={i > 0} />)}
    </svg>
  )
}

function Tower({ x, team, labels, divider }) {
  const total = Math.max(1, team.total || team.floors.length || 1)
  const fh = Math.min(22, (GROUND - 56) / total)
  const topY = GROUND - total * fh
  const bx = x + 38, bw = 124
  const built = team.floors.length
  const roofY = GROUND - built * fh
  return (
    <g>
      {divider && <line x1={x} y1={10} x2={x} y2={GROUND} stroke="#fff" strokeOpacity="0.15" strokeDasharray="4 5" />}
      {/* scaffolding for the floors to come */}
      {Array.from({ length: total - built }, (_, k) => {
        const y = roofY - (k + 1) * fh
        return <rect key={`s${k}`} x={bx} y={y} width={bw} height={fh} fill="none" stroke="#64748b" strokeOpacity="0.45" strokeDasharray="3 3" />
      })}
      {/* the floors, bottom up */}
      {team.floors.map((tenant, k) => {
        const y = GROUND - (k + 1) * fh
        return (
          <g key={k} className="fade">
            <rect x={bx} y={y} width={bw} height={fh} fill={k % 2 ? '#3b2f4a' : '#45374f'} stroke="#1a1424" strokeWidth="0.8" />
            {[0, 1, 4, 5].map((w) => <rect key={w} x={bx + 6 + w * 19} y={y + fh * 0.22} width="11" height={fh * 0.56} rx="1" fill="#fde68a" opacity={0.55 + ((k + w) % 3) * 0.15} />)}
            <rect x={bx + 44} y={y + fh * 0.14} width="36" height={fh * 0.72} rx="2" fill={team.color} />
            <text x={bx + 62} y={y + fh * 0.5 + Math.min(fh * 0.62, 11) * 0.36} textAnchor="middle" fontSize={Math.min(fh * 0.62, 11)} fontWeight="800" fill="#0f0a18" fontFamily="Inter, sans-serif">
              {tenant.length > 9 ? `${tenant.slice(0, 8)}…` : tenant}
            </text>
          </g>
        )
      })}
      {/* the roof and the neon sign */}
      <rect x={bx - 4} y={roofY - 4} width={bw + 8} height="4" fill="#1a1424" />
      <text x={bx + bw / 2} y={topY - 8} textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="Fredoka, sans-serif"
        fill={team.finished ? '#f87171' : '#fb7185'} style={{ filter: 'drop-shadow(0 0 3px #fb7185)' }}>
        {team.finished ? 'NO VACANCY' : 'VACANCY'}
      </text>
      {/* the door, the team's name, and who's applying */}
      {built === 0 && <rect x={bx} y={GROUND - 4} width={bw} height="4" fill="#45374f" />}
      {labels && (
        <g>
          <rect x={x + 6} y={6} width={Math.min(W - 12, 14 + team.name.length * 6.6)} height="16" rx="4" fill={team.color} />
          <text x={x + 13} y={17.5} fontSize="10" fontWeight="800" fontFamily="Fredoka, sans-serif" fill="#0f0a18">{team.name.length > 26 ? `${team.name.slice(0, 25)}…` : team.name}</text>
        </g>
      )}
      {team.applicant && !team.finished && (
        <g>
          <rect x={x + 50} y={GROUND + 5} width="100" height="15" rx="7" fill="#0f172a" stroke={team.color} strokeWidth="1" />
          <text x={x + 100} y={GROUND + 15.5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#e2e8f0" fontFamily="Inter, sans-serif">Applying: {team.applicant}</text>
        </g>
      )}
    </g>
  )
}
