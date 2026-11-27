import { useEffect, useState } from 'react'
import { rfGame } from './api'
import Board from './Board'
import Building from './Building'
import Lobby from './Lobby'
import StudentJoin from './StudentJoin'
import { HUB_URL, SITE_NAME, SITE_TAGLINE } from './config'
import { readSession, saveSession } from './session'
import { isConfigured } from './supabase'
import { Button, CenterCard } from './ui'
import ScenarioSubmit, { ScenarioReviewPage } from './Scenarios'

// Routes:
//   /        leader: landing -> lobby -> board (the projector)
//   /join    student phone: join, get a team, house each applicant, answer when it's your turn to lead
// (No question bank: every team's run is generated, with its own order and numbers.)
function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  if (!isConfigured) return <NotConfigured />
  if (path === '/join') return <StudentJoin />
  if (path === '/scenarios') return <ScenarioSubmit />
  if (path === '/review') return <ScenarioReviewPage />
  return <LeaderApp />
}

function LeaderApp() {
  const [saved] = useState(readSession) // a game this tab was running before the page loaded
  const [screen, setScreen] = useState(saved ? 'restoring' : 'landing') // restoring | landing | lobby | board
  const [session, setSession] = useState(null) // { gameId, hostToken, joinCode } once the game has started
  const [resume, setResume] = useState(null) // { session, teams, finalized } to rebuild the lobby
  const [lobbyNumber, setLobbyNumber] = useState(0)

  // After a refresh: ask the server for the game and put the leader back where they were
  useEffect(() => {
    if (!saved) return
    rfGame({ action: 'get_state', game_id: saved.gameId, host_token: saved.hostToken })
      .then((data) => {
        const names = (data.teams ?? []).map((t) => t.name)
        const restored = { ...saved, joinCode: data.game.join_code }
        setResume({ session: restored, teams: names, finalized: names.length > 0 })
        if (data.game.status !== 'setup') {
          setSession(restored)
          setScreen('board')
        } else {
          setScreen('lobby')
        }
      })
      .catch(() => {
        saveSession(null)
        setScreen('landing')
      })
  }, [saved])

  // Close the game: students' phones go back to the join page, and the leader starts fresh
  async function closeGame() {
    const current = session ?? resume?.session ?? readSession()
    if (current) {
      try {
        await rfGame({ action: 'close_game', game_id: current.gameId, host_token: current.hostToken })
      } catch {
        // Already gone
      }
    }
    saveSession(null)
    setSession(null)
    setResume(null)
    setLobbyNumber((n) => n + 1)
    setScreen('lobby')
  }

  if (screen === 'restoring') {
    return <CenterCard title={SITE_NAME}><p className="mt-4 text-muted">Restoring your game…</p></CenterCard>
  }

  if (screen === 'landing') {
    return (
      <main className="lab-bg flex min-h-dvh items-center justify-center p-4 text-ink">
        <div className="w-full max-w-lg text-center">
          <p className="neon flicker text-2xl">VACANCY</p>
          <h1 className="mt-2 font-display text-5xl font-bold">{SITE_NAME}</h1>
          <p className="mt-2 font-display text-lg text-spike">{SITE_TAGLINE}</p>
          <Building className="mt-6 shadow-2xl" labels={false} teams={[{ name: 'The Octet Arms', color: '#fb7185', floors: ['NH₃', 'CO₂', 'SF₄', 'H₂O', 'XeF₄'], total: 8, applicant: 'BCl₃' }]} />
          <div className="paper pinned mx-auto mt-8 rounded-2xl p-6">
          <p className="text-muted">
            One apartment building per team. Atoms apply to move in: count the deposit (valence electrons), give every
            atom a bed (Lewis structures), check the house rules (formal charge, resonance, exceptions) and draw the floor
            plan (VSEPR). Every right answer adds a floor.
          </p>
          <Button className="mt-6" onClick={() => setScreen('lobby')}>🔑 Open the leasing office</Button>
          <a href={HUB_URL} className="mt-4 block text-sm font-bold text-info hover:brightness-125">← All games</a>
          </div>
        </div>
      </main>
    )
  }

  // The lobby stays mounted (just hidden) so going back and forth keeps its state
  return (
    <>
      <div hidden={screen !== 'lobby'}>
        <Lobby
          key={lobbyNumber}
          resume={resume}
          hasGame={!!session}
          onOpenBoard={() => setScreen('board')}
          onCloseGame={closeGame}
          onStart={(started) => { setSession(started); setScreen('board') }}
        />
      </div>
      {session && screen === 'board' && (
        <Board session={session} onLobby={() => setScreen('lobby')} onNewGame={closeGame} />
      )}
    </>
  )
}

function NotConfigured() {
  return (
    <CenterCard title="Setup needed">
      <p className="mt-4 text-muted">
        Add your Supabase address and public key to <code>.env.local</code> (see <code>.env.example</code>), then restart.
      </p>
    </CenterCard>
  )
}

export default App
