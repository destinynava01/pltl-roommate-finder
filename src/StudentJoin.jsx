import { useCallback, useEffect, useRef, useState } from 'react'
import { rfPlay, watchGame } from './api'
import Building from './Building'
import Lewis from './Lewis'
import Shape3D from './Shape3D'
import { clockText, roundOf, SITE_NAME } from './config'
import { playClosed, playSolved, playWrong } from './sounds'
import { Button, CenterCard, Label, Paper, Stamp } from './ui'

const STORAGE_KEY = 'roommateStudent'
const DEVICE_KEY = 'roommateDevice'
const field = 'w-full rounded-lg border border-line bg-panel px-4 py-3 text-center text-xl font-bold text-ink outline-none focus:border-accent'

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(DEVICE_KEY, id) }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
const readSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null } }
const writeSaved = (v) => { try { v ? localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) : localStorage.removeItem(STORAGE_KEY) } catch { /* blocked */ } }

// The phone: join, wait for a team, then work through the run. Everyone sees the applicant and can work it out on
// their own phone; the lead leasing agent (it rotates every step) sends the team's answer.
export default function StudentJoin() {
  const [saved, setSaved] = useState(readSaved)
  const [notice, setNotice] = useState('')
  const leave = useCallback((message = '') => { writeSaved(null); setSaved(null); setNotice(message) }, [])
  return saved ? <Room saved={saved} onLeave={leave} /> : <JoinForm notice={notice} onJoined={(v) => { writeSaved(v); setSaved(v); setNotice('') }} />
}

function JoinForm({ onJoined, notice }) {
  const [code, setCode] = useState(() => (new URLSearchParams(window.location.search).get('code') ?? '').toUpperCase())
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function join(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const d = await rfPlay({ action: 'join', join_code: code, display_name: name, device_id: deviceId() })
      onJoined({ playerId: d.player.id, gameId: d.game.id })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <CenterCard title={SITE_NAME}>
      <p className="mt-2 text-muted">Atoms are lining up at the Octet Arms. Ready to find them roommates?</p>
      <form onSubmit={join} className="mt-4 space-y-4">
        {notice && <p className="font-bold text-muted">{notice}</p>}
        <div>
          <Label>Game code</Label>
          <input className={`${field} mt-2 uppercase tracking-[0.4em]`} maxLength={6} placeholder="ABC123" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoCapitalize="characters" autoComplete="off" />
        </div>
        <div>
          <Label>Your name</Label>
          <input className={`${field} mt-2`} maxLength={40} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <Button className="w-full" disabled={busy || code.length < 6 || !name.trim()}>{busy ? 'Joining…' : 'Join'}</Button>
        {error && <p className="font-bold text-bad">{error}</p>}
      </form>
    </CenterCard>
  )
}

function Room({ saved, onLeave }) {
  const [view, setView] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null) // { kind: 'right' | 'wrong' | 'closed' | 'info', text, at }
  const [now, setNow] = useState(() => Date.now())
  const lastEvent = useRef(null)
  const ownPlay = useRef(false)
  const stamp = useRef(0)
  const say = (kind, text) => { stamp.current += 1; setFlash({ kind, text, at: stamp.current }) }

  const check = useCallback(() => rfPlay({ action: 'status', player_id: saved.playerId, device_id: deviceId() })
    .then((d) => {
      if (d.ended) return onLeave('That game has ended. Join another with a new code.')
      // A teammate (the lead) answered: sounds for everyone, a note when it wasn't this phone
      const e = d.last_event
      if (e && lastEvent.current && e.at !== lastEvent.current) {
        if (e.kind === 'closed') playClosed()
        else if (e.kind === 'wrong') playWrong()
        else playSolved()
        if (!ownPlay.current && !e.mine) {
          if (e.kind === 'wrong') say('wrong', `🔍 ${e.by}'s answer didn't work. Look again together.`)
          else if (e.kind === 'closed') say('closed', '🎉 Your building is fully booked!')
          else say('right', `✅ ${e.by} moved them in. On to the next applicant!`)
        }
      }
      ownPlay.current = false
      lastEvent.current = e?.at ?? lastEvent.current ?? 'none'
      setView({ ...d, offset: Date.parse(d.server_now) - Date.now() })
      setError('')
    })
    .catch((err) => {
      if (/not found|another phone/i.test(err.message)) return onLeave('You were removed from that game.')
      setError(err.message)
    }), [saved, onLeave])

  useEffect(() => {
    check()
    return watchGame(saved.gameId, ['state', 'lobby'], check, 5000)
  }, [saved, check])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])

  async function send(action, answer) {
    setBusy(true)
    setError('')
    try {
      ownPlay.current = true
      const r = await rfPlay({ action, player_id: saved.playerId, device_id: deviceId(), step: view.case.step, answer })
      if (r.closed) say('closed', `🎉 ${r.feedback} Your building is fully booked${r.rank ? ` (#${r.rank} to finish)` : ''}!`)
      else if (r.revealed) say('info', `📂 ${r.feedback}`)
      else if (r.correct) say('right', `✅ ${r.feedback} +${r.points}`)
      else say('wrong', `❌ ${r.feedback}${r.can_reveal ? ' (You can ask to see the answer now.)' : ''}`)
      await check()
    } catch (e) {
      ownPlay.current = false
      setError(e.message)
      check()
    } finally {
      setBusy(false)
    }
  }

  if (!view) return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">{error || 'Connecting…'}</p></CenterCard>
  const { player, teams } = view
  const myTeam = teams[player.team_index]
  const c = view.case
  const left = view.game.ends_at ? Date.parse(view.game.ends_at) - (now + view.offset) : null
  let body

  if (player.approval_status !== 'approved') body = <Note title="Almost in!" text="Your leader will put you on a team in a moment." />
  else if (view.game.status === 'setup') body = <Note title={`You're on ${myTeam?.name ?? 'a team'}`} text="The game starts soon. Grab some scratch paper for drawing Lewis structures, and watch the projector." />
  else if (!c) body = <Note title="Unlocking the doors…" text="" />
  else if (view.game.status === 'finished' || c.finished) {
    body = (
      <>
        <Paper className="text-center">
          {c.finished ? <Stamp className="text-3xl">Fully booked</Stamp> : <p className="font-display text-2xl">Time&apos;s up!</p>}
          <p className="mt-4 font-display text-xl">{myTeam?.name}: {c.points} points</p>
          <p className="mt-1 text-muted">{c.solved.length} of {c.steps} steps{c.finish_rank ? ` · #${c.finish_rank} to finish` : ''}</p>
        </Paper>
        <MyBuilding c={c} team={myTeam} />
        <Notes c={c} />
      </>
    )
  } else {
    body = (
      <>
        <RoundProgress f={c.file} />
        <Task key={c.step} c={c} color={myTeam?.color} lead={view.lead} busy={busy} canReveal={view.can_reveal} onAnswer={(a) => send('answer', a)} onReveal={() => send('reveal')} />
        <MyBuilding c={c} team={myTeam} />
        <Notes c={c} />
      </>
    )
  }

  return (
    <main className="lab-bg min-h-dvh text-ink">
      <div className="mx-auto max-w-md space-y-4 p-4">
        <header className="flex items-center justify-between gap-2 rounded-xl border border-line bg-card/90 px-3 py-2 shadow">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{player.display_name}</p>
            {myTeam && <p className="text-sm text-muted"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: myTeam.color }} />{myTeam.name}</p>}
          </div>
          <div className="text-right">
            {left !== null && view.game.status === 'playing' && <p className={`font-display text-xl ${left < 120000 ? 'text-fire' : ''}`}>⏱ {clockText(left)}</p>}
            {c && <p className="font-display text-sm text-spike">{c.points} pts</p>}
          </div>
        </header>
        {flash && (
          <p key={flash.at} className={`pop rounded-xl px-4 py-3 font-semibold shadow ${flash.kind === 'wrong' ? 'shake bg-bad-soft text-bad' : flash.kind === 'info' ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok'}`}>{flash.text}</p>
        )}
        {body}
        {error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-center font-bold text-bad">{error}</p>}
        <p className="text-center"><button onClick={() => onLeave()} className="text-sm text-muted hover:text-ink">Leave game</button></p>
      </div>
    </main>
  )
}

function RoundProgress({ f }) {
  return (
    <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${f.rounds.length}, minmax(0, 1fr))` }}>
      {f.rounds.map((r) => {
        const meta = roundOf(r.id)
        const done = r.done === r.steps
        const now = f.current?.round === r.id
        return (
          <li key={r.id} className={`rounded-lg px-1 py-1.5 text-center text-xs font-bold shadow ${done ? 'bg-ok-soft text-ok' : now ? 'bg-accent-soft text-accent' : 'bg-card/70 text-muted'}`}>
            <span className="block text-lg">{done ? '✓' : meta.emoji}</span>{r.done}/{r.steps}
          </li>
        )
      })}
    </ol>
  )
}

const box = 'w-full min-w-0 rounded-lg border border-line bg-panel px-2 py-2 text-center text-lg font-bold text-ink outline-none focus:border-accent'
const chip = (on) => `rounded-lg border px-2 py-2 text-center font-bold transition ${on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel hover:bg-hover'}`
const filled = (v) => String(v ?? '').trim() !== ''
const cleanMinus = (v) => v.replace(/[−–]/g, '-')

// A number box that takes negatives and fractions ("-3", "1/2")
function Num({ value, onChange, label, placeholder = '', className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-bold text-muted">{label}</span>}
      <input className={box} value={value} placeholder={placeholder} inputMode="text" autoComplete="off" autoCorrect="off" spellCheck={false}
        onChange={(e) => onChange(cleanMinus(e.target.value))} />
    </label>
  )
}

// The current step: the applicant, the question, the inputs for its kind, and (for the lead) the send button
function Task({ c, color, lead, busy, canReveal, onAnswer, onReveal }) {
  const cur = c.file.current
  const [answer, setAnswer] = useState(() => blank(cur))
  const isLead = lead?.me
  const round = roundOf(cur.round)
  const set = (patch) => setAnswer({ ...answer, ...patch })
  const gate = ready(cur, answer)
  return (
    <Paper>
      <Label>{round.emoji} {round.title} · step {c.step + 1} of {c.steps}</Label>
      <h2 className="mt-1 font-display text-2xl font-bold text-accent">{cur.title}</h2>
      {cur.mol && cur.kind !== 'build' && !cur.show && !cur.options && (
        <p className="mt-3 rounded-xl bg-panel py-4 text-center font-display text-5xl font-bold" style={{ color }}>{cur.mol.f}</p>
      )}
      {cur.pair && <p className="mt-3 rounded-xl bg-panel py-4 text-center font-display text-4xl font-bold" style={{ color }}>{cur.pair.a}–{cur.pair.b}</p>}
      {cur.show && <div className="mx-auto mt-3 max-w-[18rem]"><Lewis mol={cur.mol} s={cur.show.s} mark={cur.show.mark} /></div>}
      {cur.options && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {cur.options.map((o) => (
            <div key={o.label}>
              <p className="text-center font-display text-xl font-bold">{o.label}</p>
              <Lewis mol={cur.mol} s={o.s} />
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 font-semibold">{cur.prompt}</p>

      <div className="mt-4">
        {cur.kind === 'build' && <Builder mol={cur.mol} total={cur.total} value={answer} onChange={setAnswer} />}
        {cur.kind === 'number' && <Num label={cur.fixed ? 'Your answer' : cur.round === 'deposit' ? 'Valence electrons' : cur.show ? 'Formal charge (like 0, +1 or -1)' : 'Your answer'} placeholder="#" value={answer.number} onChange={(number) => set({ number })} />}
        {cur.kind === 'pick' && (
          <div className="space-y-3">
            {cur.fields.map((f) => (
              <fieldset key={f.key}>
                {cur.fields.length > 1 && <legend className="mb-1 text-sm font-bold text-muted">{f.label}</legend>}
                <div className={`grid gap-1.5 ${f.choices.length > 4 ? 'grid-cols-2' : ''}`}>
                  {f.choices.map((ch) => (
                    <button key={ch.id} type="button" onClick={() => set({ picks: { ...answer.picks, [f.key]: ch.id } })}
                      className={`${chip(answer.picks[f.key] === ch.id)} text-sm`}>{ch.text}</button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </div>

      {isLead && <Button className="mt-4 w-full" disabled={busy || !gate.ok} onClick={() => onAnswer(answer)}>{busy ? 'Checking…' : gate.ok ? '🔑 Hand over the keys' : gate.why}</Button>}
      <div className="mt-4 rounded-lg bg-panel px-3 py-2 text-sm">
        {isLead
          ? <p className="font-bold text-accent">🔑 You&apos;re the lead leasing agent for this step. Talk it through with your team, then send the answer.</p>
          : <p>🔑 <b>{lead?.name ?? 'Your teammate'}</b> is the lead leasing agent for this step. Work it out here too and help out loud: only the lead&apos;s answer counts.</p>}
        {c.misses > 0 && <p className="mt-1 text-bad">{c.misses} wrong tr{c.misses === 1 ? 'y' : 'ies'} on this step (each costs a quarter of its points).</p>}
      </div>
      {isLead && canReveal && (
        <button type="button" disabled={busy} onClick={() => window.confirm('Show the answer? This step scores 0, but your team moves on.') && onReveal()} className="mt-3 w-full text-sm font-bold text-warn underline">
          Stuck? Show us the answer (0 points for this step)
        </button>
      )}
    </Paper>
  )
}

function blank(cur) {
  if (cur.kind === 'build') return { bonds: cur.mol.o.map(() => 1), lone: cur.mol.o.map(() => 0), center: 0 }
  if (cur.kind === 'pick') return { picks: {} }
  return { number: '' }
}
const spent = (a) => 2 * a.bonds.reduce((n, x) => n + x, 0) + 2 * a.lone.reduce((n, x) => n + x, 0) + a.center
function ready(cur, a) {
  if (cur.kind === 'number') return filled(a.number) ? { ok: true } : { ok: false, why: 'Type your answer' }
  if (cur.kind === 'pick') return cur.fields.every((f) => a.picks[f.key]) ? { ok: true } : { ok: false, why: 'Pick an answer for each part' }
  const used = spent(a)
  return used === cur.total ? { ok: true } : { ok: false, why: `Spend exactly ${cur.total} electrons (now ${used})` }
}

// Move-in day: tap a bond to switch single, double, triple; set every atom's lone pairs. The drawing and the counter
// update live.
function Builder({ mol, total, value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const cycleBond = (i) => { if (mol.o[i] !== 'H') set({ bonds: value.bonds.map((b, k) => (k === i ? (b % 3) + 1 : b)) }) }
  const setLone = (i, d) => set({ lone: value.lone.map((l, k) => (k === i ? Math.max(0, Math.min(mol.o[i] === 'H' ? 0 : 3, l + d)) : l)) })
  const used = spent(value)
  const BOND = ['', '–', '=', '≡']
  return (
    <div className="space-y-3">
      <div className="mx-auto max-w-[19rem]">
        <Lewis mol={mol} s={{ b: value.bonds, l: value.lone, e: value.center }} counts onBond={cycleBond}
          onAtom={(i) => (i < 0 ? set({ center: (value.center + 2) % 14 }) : setLone(i, value.lone[i] >= 3 ? -3 : 1))} />
      </div>
      <p className={`rounded-lg px-3 py-2 text-center font-bold ${used === total ? 'bg-ok-soft text-ok' : used > total ? 'bg-bad-soft text-bad' : 'bg-panel text-ink'}`}>
        Electrons used: {used} of {total}{used > total ? ' (over budget)' : ''}
      </p>
      <p className="text-xs text-muted">Tap a bond to switch single, double, triple. Tap an atom to add a lone pair (or use the buttons).</p>
      <ul className="space-y-1.5">
        {mol.o.map((el, i) => (
          <li key={i} className="flex items-center gap-2 rounded-lg bg-panel px-2 py-1.5">
            <span className="w-8 text-center text-lg font-bold">{el}</span>
            <span className="flex gap-1">
              {[1, 2, 3].map((b) => (
                <button key={b} type="button" disabled={el === 'H' && b > 1} onClick={() => set({ bonds: value.bonds.map((x, k) => (k === i ? b : x)) })}
                  className={`h-9 w-9 rounded-md border text-lg font-bold disabled:opacity-30 ${value.bonds[i] === b ? 'border-accent bg-accent-soft text-accent' : 'border-line'}`}
                  aria-label={`${['single', 'double', 'triple'][b - 1]} bond to ${el}`}>{BOND[b]}</button>
              ))}
            </span>
            <Stepper label="lone pairs" value={value.lone[i]} onMinus={() => setLone(i, -1)} onPlus={() => setLone(i, 1)} disabled={el === 'H'} />
          </li>
        ))}
        <li className="flex items-center gap-2 rounded-lg border border-dashed border-line px-2 py-1.5">
          <span className="w-8 text-center text-lg font-bold">{mol.c}</span>
          <span className="text-xs text-muted">landlord&apos;s own electrons</span>
          <Stepper label="electrons" value={value.center} onMinus={() => set({ center: Math.max(0, value.center - 1) })} onPlus={() => set({ center: Math.min(12, value.center + 1) })} />
        </li>
      </ul>
    </div>
  )
}

function Stepper({ label, value, onMinus, onPlus, disabled = false }) {
  const btn = 'h-9 w-9 rounded-md border border-line text-lg font-bold disabled:opacity-30'
  return (
    <span className="ml-auto flex items-center gap-1.5">
      <button type="button" className={btn} disabled={disabled || value === 0} onClick={onMinus} aria-label={`Fewer ${label}`}>−</button>
      <span className="w-14 text-center text-sm"><b className="text-base">{value}</b> <span className="text-muted">{label === 'lone pairs' ? 'pairs' : 'e⁻'}</span></span>
      <button type="button" className={btn} disabled={disabled} onClick={onPlus} aria-label={`More ${label}`}>+</button>
    </span>
  )
}

// The team's own building, as it stands
function MyBuilding({ c, team }) {
  if (!team) return null
  return (
    <Paper pinned={false} className="!p-3">
      <Label className="mb-2">Your building · {c.file.floors.length} of {c.steps} floors</Label>
      <Building labels={false} teams={[{ name: team.name, color: team.color, floors: c.file.floors.map((f) => f.tenant), total: c.steps, finished: c.finished }]} />
    </Paper>
  )
}

// Every solved step: the answer and why, with the Lewis structure and the 3D floor plan when there is one
function Notes({ c }) {
  const notes = c.file.notes
  if (!notes.length) return null
  return (
    <Paper pinned={false}>
      <Label>Your notes</Label>
      <ol className="mt-2 space-y-2 text-sm">
        {[...notes].reverse().map((n) => (
          <li key={n.step} className="rounded-lg bg-panel px-3 py-2">
            <p className="font-bold">{roundOf(n.round).emoji} {n.title}: <span className="text-accent">{n.answer}</span></p>
            <p className="mt-0.5 text-muted">{n.explain}</p>
            {(n.lewis || n.plan) && n.mol && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {n.lewis && <Lewis mol={n.mol} s={n.lewis} />}
                {n.plan && <Shape3D plan={n.plan} center={n.mol.c} outer={n.mol.o} bg="#fffdf7" />}
              </div>
            )}
          </li>
        ))}
      </ol>
    </Paper>
  )
}

function Note({ title, text }) {
  return (
    <Paper className="text-center">
      <h2 className="font-display text-2xl font-bold text-accent">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </Paper>
  )
}
