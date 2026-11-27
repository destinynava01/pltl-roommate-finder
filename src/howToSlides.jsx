/* eslint-disable react-refresh/only-export-components -- static slide content with small local helpers */
// The "How to play" slides for Roommate Finder (shown before the game starts). The art uses the same pieces as the
// real game (the building, the Lewis drawing, the 3D floor plan).
import Building from './Building'
import Lewis from './Lewis'
import Shape3D from './Shape3D'

function Panel({ children, className = '' }) {
  return <div className={`paper w-full max-w-sm rounded-xl p-4 text-left text-sm text-ink ${className}`}>{children}</div>
}

const DEMO = [
  { name: 'Team 1', color: '#22d3ee', floors: ['NH₃', 'CO₂', 'SF₄', 'H₂O'], total: 12, applicant: 'BCl₃' },
  { name: 'Team 2', color: '#f472b6', floors: ['NO₃⁻', 'CH₄', 'XeF₄', 'HCN', 'OF₂', 'PCl₅'], total: 12, applicant: 'I₃⁻' },
  { name: 'Team 3', color: '#a3e635', floors: ['CS₂', 'NH₄⁺', 'ClF₃'], total: 12, applicant: 'H₂S' },
]
const HCN = { c: 'C', o: ['H', 'N'], q: 0 }

export const SLIDES = [
  {
    title: 'Welcome to the Octet Arms',
    text: 'Every team runs one apartment building. Atoms apply to move in as molecules and ions. Find every atom a bed and the molecule moves in: your building gets a new floor. Every team gets its own applicants, so no copying.',
    art: <Building teams={DEMO} className="max-w-xl" />,
  },
  {
    title: 'The house rules',
    text: 'The landlord is the central atom. Bonds are shared rooms, lone pairs are private rooms, and most atoms need 8 beds (H needs 2). The deposit is the total valence electrons: spend it exactly. The best arrangement has formal charges closest to zero.',
    art: (
      <Panel>
        <div className="mx-auto max-w-[13rem]"><Lewis mol={HCN} s={{ b: [1, 3], l: [0, 1], e: 0 }} counts /></div>
        <p className="mt-2 rounded-lg bg-ok-soft px-3 py-1.5 text-center font-bold text-ok">Electrons used: 10 of 10</p>
      </Panel>
    ),
  },
  {
    title: 'One lead leasing agent at a time',
    text: 'Everyone\'s phone shows the applicant and the answer buttons, so everyone can work it out. But one student is the lead leasing agent and sends the team\'s answer. The role moves to the next teammate after every step, so talk it through first.',
    art: (
      <Panel>
        <p className="font-display text-lg font-bold text-accent">Floor plan: SF₄</p>
        <div className="mx-auto mt-2 max-w-[9rem]"><Shape3D plan={{ domains: 5, lone: 1 }} center="S" outer={['F', 'F', 'F', 'F']} bg="#fffdf7" /></div>
        <p className="mt-2 rounded-lg bg-accent px-3 py-2 text-center font-display font-bold text-on-accent">🔑 Hand over the keys</p>
      </Panel>
    ),
  },
  {
    title: 'The rounds',
    text: 'The deposit (valence electrons), Move-in day (Lewis structures), House rules (formal charge, the better structure, resonance and octet exceptions), Floor plan (VSEPR shapes and bond angles), and Blanket hog (bond polarity).',
    art: (
      <Panel>
        <ol className="space-y-1 text-base">
          <li>💰 <b>The deposit</b></li>
          <li>🛏️ <b>Move-in day</b></li>
          <li>📋 <b>House rules</b></li>
          <li>📐 <b>Floor plan</b></li>
          <li>🤝 <b>Blanket hog</b></li>
        </ol>
      </Panel>
    ),
  },
  {
    title: 'Points',
    text: 'Each step is worth 50 points; every wrong try costs a quarter. Stuck after three tries? You can see the answer and move on, for 0 points. Every answer goes into your team\'s notes with the Lewis structure and the 3D floor plan, so your phone ends up as a study sheet. Finish first for a bonus!',
    art: (
      <Panel>
        <p className="flex justify-between font-display text-lg font-bold"><span>🥇 Team 2</span><span className="text-spike">585</span></p>
        <p className="mt-1 flex justify-between font-display text-lg font-bold"><span>🥈 Team 1</span><span className="text-spike">540</span></p>
        <p className="mt-4 text-center"><span className="stamp text-xl">Fully booked</span></p>
      </Panel>
    ),
  },
]

// The guide's own look: a lobby panel on the night street
export const SKIN = {
  backdrop: 'bg-[#080a18]/85',
  panel: 'rounded-xl border border-line bg-card text-ink shadow-2xl',
  glow: true,
  label: 'font-display text-sm font-bold tracking-[0.15em]',
  skip: 'rounded-lg border border-line bg-panel px-3 py-1 text-sm font-bold text-muted hover:bg-hover',
  art: 'lab-bg rounded-xl',
  step: 'text-sm font-bold uppercase tracking-widest text-muted',
  title: 'font-display text-3xl font-bold leading-tight text-accent sm:text-4xl',
  text: 'text-lg leading-relaxed text-ink',
  footer: 'border-t border-line bg-panel',
  check: 'text-sm text-muted',
  back: 'rounded-lg border border-line bg-card px-4 py-2 font-display text-ink hover:bg-hover',
  next: 'rounded-lg bg-accent px-5 py-2 font-display text-lg font-bold text-on-accent hover:brightness-110',
  dotOff: '#3c4270',
  launcher: 'rounded-lg border border-line bg-card px-4 py-2 font-display text-sm font-bold text-accent shadow-lg hover:bg-hover',
}
