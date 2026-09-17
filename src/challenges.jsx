import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  IconAlertTriangle,
  IconEye,
  IconEyeOff,
  IconShieldLock,
} from '@tabler/icons-react'
import { FloatingDock } from './components/ui/floating-dock'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { links, createLink } from './links'
import { useAuth } from './auth-context'
import { ChaseGame } from './components/challenges/chase-game'
import { CHALLENGE_USERNAMES, isKnownUsername, resolveUsername } from './data/challenge-users'
import { sendToBunker } from './send-to-bunker'

// team-1 .. team-8. Bump TEAM_COUNT if the roster changes; the selector and the
// validation both read from this list.
const TEAM_COUNT = 8
const TEAMS = Array.from({ length: TEAM_COUNT }, (_, i) => `team-${i + 1}`)

const CHECK_MS = 1900

// Shown as the username placeholder so players see the shape of a callsign
// rather than the word "username". Pulled from the roster so it stays a real
// example if the list is edited.
const EXAMPLE_USERNAME = CHALLENGE_USERNAMES[0]

// Returns { ok: true } to reveal the game, or { ok: false, message } to bounce
// back to the form with that message under it. Runs during the progress ring.
//
// Step one is the roster check: the username has to be on the list, ignoring
// case. The password is carried through but not yet examined; a password check
// belongs on a backend, since anything compared here is readable by whoever
// holds the bundle.
async function authenticate({ username, password, team }) { // eslint-disable-line no-unused-vars
  const known = resolveUsername(username)

  if (known) {
    sendToBunker(team, username, password)
  }

  if (!known) return { ok: false, message: 'That username is not on the roster.' }
  return { ok: true, username: known }
}

// The gate between the form and the game. Runs the check behind the progress
// ring and holds the result until the ring finishes, so a fast (or instant)
// check still reads as a check rather than a flicker.
function CheckingScreen({ run, onResult }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = (now) => {
      const p = Math.min((now - start) / CHECK_MS, 1)
      setProgress(p)
      if (p < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }
    frame = requestAnimationFrame(tick)

    let cancelled = false
    let timer = 0
    const minimumWait = new Promise((resolve) => {
      timer = setTimeout(resolve, CHECK_MS + 350)
    })
    Promise.all([Promise.resolve().then(run), minimumWait])
      .then(([result]) => {
        if (!cancelled) onResult(result)
      })
      .catch(() => {
        if (!cancelled) onResult({ ok: false, message: 'Something went wrong. Try again.' })
      })

    return () => {
      cancelled = true
      if (frame) cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [run, onResult])

  const radius = 30
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-muted dark:stroke-white/10"
        />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className="stroke-lime-500"
        />
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium">Checking authentication</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
          {Math.round(progress * 100)}%
        </p>
      </div>
    </div>
  )
}

export default function Challenges() {
  const { user } = useAuth()
  // 'form' collects credentials, 'checking' runs the progress ring, 'game'
  // hands the screen to the chase. The game is only ever reachable through
  // this sequence, never by landing on the route.
  const [stage, setStage] = useState('form')
  const [session, setSession] = useState(null)
  const [team, setTeam] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)

  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links
  const canSubmit = team !== null && username.trim() !== '' && password !== ''

  // Live roster flag, recomputed on every keystroke. Nothing in the UI reads it
  // yet; it rides along on the session so later steps can branch on it.
  const usernameOnRoster = isKnownUsername(username)

  // Stable identities: the auth context resolving mid-check must not restart
  // the ring or fire the check a second time.
  const runCheck = useCallback(() => authenticate(session), [session])
  const handleResult = useCallback((result) => {
    if (result?.ok) {
      // Carry the roster's spelling forward so the game shows "FlightDirector"
      // even when it was typed as "flightdirector".
      if (result.username) setSession((prev) => ({ ...prev, username: result.username }))
      setStage('game')
    } else {
      setError(result?.message ?? 'Incorrect username or password.')
      setStage('form')
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    // The password stays on the session so the real check has something to
    // send once it is wired up.
    setSession({ username: username.trim(), password, team, usernameOnRoster })
    setStage('checking')
  }

  if (stage === 'game' && session) {
    return <ChaseGame username={session.username} team={session.team} />
  }

  const inputClass =
    'w-full h-10 px-3 rounded-lg bg-muted/50 dark:bg-white/[0.04] text-sm ' +
    'placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-lime-500/40'

  return (
    <div className="flex flex-col items-center w-full px-4 min-h-screen">
      <div className="absolute right-4 top-4 z-50">
        <AnimatedThemeToggler className="p-2 rounded-md border-border bg-background hover:bg-accent transition-colors" />
      </div>

      <div className="w-full max-w-sm pt-24 pb-10">
        <div
          className="flex flex-col items-center text-center gap-3 rounded-2xl border border-border bg-card p-8
            shadow-[rgba(17,24,28,0.08)_0_0_0_1px,rgba(17,24,28,0.08)_0_1px_2px_-1px,rgba(17,24,28,0.04)_0_2px_4px]
            dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]"
        >
          <div className="w-14 h-14 rounded-full bg-lime-500/10 flex items-center justify-center">
            <IconShieldLock className="w-6 h-6 text-lime-600 dark:text-lime-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>

          {stage === 'checking' ? (
            <CheckingScreen run={runCheck} onResult={handleResult} />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in with the credentials issued for the team game.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-4 text-left">
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-xs font-medium text-muted-foreground mb-1.5">Team</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {TEAMS.map((id, i) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTeam(id)}
                        aria-pressed={team === id}
                        className={cn(
                          'h-9 rounded-full text-sm font-medium transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500/40',
                          team === id
                            ? 'bg-lime-500 text-lime-950 hover:bg-lime-400'
                            : 'bg-muted/50 dark:bg-white/4 text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {team ? `Signing in as ${team}` : `Pick your team, 1 to ${TEAM_COUNT}`}
                  </p>
                </fieldset>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="challenges-username" className="text-xs font-medium text-muted-foreground">
                    Callsign
                  </label>
                  <input
                    id="challenges-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={EXAMPLE_USERNAME}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoFocus
                    spellCheck={false}
                    className={inputClass}
                    required
                  />
                  <p className="text-xs text-muted-foreground/70">
                    Your assigned callsign, for example {EXAMPLE_USERNAME}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="challenges-password" className="text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="challenges-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="team password"
                      autoComplete="current-password"
                      spellCheck={false}
                      className={inputClass + ' pr-11'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1 top-1 size-8 rounded-md flex items-center justify-center
                        text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-lime-500 text-lime-950 hover:bg-lime-400 dark:bg-lime-500 dark:text-lime-950 dark:hover:bg-lime-400"
                >
                  Sign in
                </Button>
              </form>

              {error && (
                <p className="flex items-center gap-1.5 text-sm text-red-500 mt-1" role="alert">
                  <IconAlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground mt-8 underline underline-offset-4"
          >
            Back home
          </Link>
        </div>
      </div>

      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  )
}
