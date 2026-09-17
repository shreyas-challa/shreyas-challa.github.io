import { useCallback, useEffect, useRef, useState } from 'react'
import { IconCheck, IconRefresh } from '@tabler/icons-react'

const ROUND_MS = 60000
const RADIUS = 26

// The circle drifts at BASE_SPEED and ramps toward MAX_SPEED as the clock runs
// down, so the last fifteen seconds are the hard ones. Speeds are px/second.
const BASE_SPEED = 170
const MAX_SPEED = 430

// A fresh heading is picked on this cadence and eased into, which keeps the
// motion unpredictable without the teleport-feel of instant direction flips.
const TURN_MIN_MS = 600
const TURN_MAX_MS = 1500
const TURN_EASING = 3.5

function formatClock(ms) {
  const clamped = Math.max(0, ms)
  const minutes = Math.floor(clamped / 60000)
  const seconds = Math.floor((clamped % 60000) / 1000)
  const tenths = Math.floor((clamped % 1000) / 100)
  return minutes + ':' + String(seconds).padStart(2, '0') + '.' + tenths
}

function randomHeading() {
  const angle = Math.random() * Math.PI * 2
  return { x: Math.cos(angle), y: Math.sin(angle) }
}

export function ChaseGame({ username, team }) {
  // 'idle' waits for the cursor to find the circle, 'running' is a live round,
  // 'failed' is the beat after the cursor slipped out, 'won' is a full minute.
  const [phase, setPhase] = useState('idle')
  const [remaining, setRemaining] = useState(ROUND_MS)
  const [attempts, setAttempts] = useState(1)

  const arenaRef = useRef(null)
  const circleRef = useRef(null)
  const frameRef = useRef(0)

  // Everything the animation loop touches lives in refs: a round runs at 60fps
  // and re-rendering React on every frame would cost more than it buys. Only
  // the clock readout and the phase are state.
  const posRef = useRef({ x: 0, y: 0 })
  const headingRef = useRef(randomHeading())
  const targetHeadingRef = useRef(headingRef.current)
  const nextTurnRef = useRef(0)
  const pointerRef = useRef(null)
  const remainingRef = useRef(ROUND_MS)
  const phaseRef = useRef('idle')
  const shownTenthRef = useRef(-1)

  const setPhaseSafe = useCallback((next) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const paint = useCallback(() => {
    const el = circleRef.current
    if (el) {
      const x = posRef.current.x - RADIUS
      const y = posRef.current.y - RADIUS
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'
    }
  }, [])

  const centerCircle = useCallback(() => {
    const arena = arenaRef.current
    if (!arena) return
    const { width, height } = arena.getBoundingClientRect()
    posRef.current = { x: width / 2, y: height / 2 }
    paint()
  }, [paint])

  const resetRound = useCallback((nextPhase) => {
    cancelAnimationFrame(frameRef.current)
    remainingRef.current = ROUND_MS
    shownTenthRef.current = -1
    setRemaining(ROUND_MS)
    headingRef.current = randomHeading()
    targetHeadingRef.current = headingRef.current
    centerCircle()
    setPhaseSafe(nextPhase)
  }, [centerCircle, setPhaseSafe])

  useEffect(() => {
    centerCircle()
    const onResize = () => {
      const arena = arenaRef.current
      if (!arena) return
      const { width, height } = arena.getBoundingClientRect()
      posRef.current.x = Math.min(Math.max(posRef.current.x, RADIUS), width - RADIUS)
      posRef.current.y = Math.min(Math.max(posRef.current.y, RADIUS), height - RADIUS)
      paint()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frameRef.current)
    }
  }, [centerCircle, paint])

  const fail = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    setAttempts((n) => n + 1)
    resetRound('failed')
  }, [resetRound])

  const startRound = useCallback(() => {
    headingRef.current = randomHeading()
    targetHeadingRef.current = headingRef.current
    nextTurnRef.current = TURN_MIN_MS
    remainingRef.current = ROUND_MS
    shownTenthRef.current = -1
    setRemaining(ROUND_MS)
    setPhaseSafe('running')

    let last = performance.now()
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05) // a tab-switch must not teleport the circle
      last = now

      const arena = arenaRef.current
      if (!arena) return
      const { width, height } = arena.getBoundingClientRect()

      remainingRef.current -= dt * 1000
      if (remainingRef.current <= 0) {
        remainingRef.current = 0
        setRemaining(0)
        cancelAnimationFrame(frameRef.current)
        setPhaseSafe('won')
        return
      }

      // The readout only shows tenths, so re-render ten times a second rather
      // than on all sixty frames. The circle itself is moved imperatively.
      const tenth = Math.floor(remainingRef.current / 100)
      if (tenth !== shownTenthRef.current) {
        shownTenthRef.current = tenth
        setRemaining(remainingRef.current)
      }

      // Ease the live heading toward the target, then re-target on a timer.
      nextTurnRef.current -= dt * 1000
      if (nextTurnRef.current <= 0) {
        targetHeadingRef.current = randomHeading()
        nextTurnRef.current = TURN_MIN_MS + Math.random() * (TURN_MAX_MS - TURN_MIN_MS)
      }
      const blend = Math.min(dt * TURN_EASING, 1)
      let hx = headingRef.current.x + (targetHeadingRef.current.x - headingRef.current.x) * blend
      let hy = headingRef.current.y + (targetHeadingRef.current.y - headingRef.current.y) * blend
      const len = Math.hypot(hx, hy) || 1
      hx /= len
      hy /= len

      const progress = 1 - remainingRef.current / ROUND_MS
      const speed = BASE_SPEED + (MAX_SPEED - BASE_SPEED) * progress

      let nx = posRef.current.x + hx * speed * dt
      let ny = posRef.current.y + hy * speed * dt

      // Reflect off the walls instead of clamping, so the circle never pins
      // itself into a corner where the round would be trivially survivable.
      if (nx < RADIUS) {
        nx = RADIUS
        hx = Math.abs(hx)
        targetHeadingRef.current = { x: Math.abs(targetHeadingRef.current.x), y: targetHeadingRef.current.y }
      } else if (nx > width - RADIUS) {
        nx = width - RADIUS
        hx = -Math.abs(hx)
        targetHeadingRef.current = { x: -Math.abs(targetHeadingRef.current.x), y: targetHeadingRef.current.y }
      }
      if (ny < RADIUS) {
        ny = RADIUS
        hy = Math.abs(hy)
        targetHeadingRef.current = { x: targetHeadingRef.current.x, y: Math.abs(targetHeadingRef.current.y) }
      } else if (ny > height - RADIUS) {
        ny = height - RADIUS
        hy = -Math.abs(hy)
        targetHeadingRef.current = { x: targetHeadingRef.current.x, y: -Math.abs(targetHeadingRef.current.y) }
      }

      headingRef.current = { x: hx, y: hy }
      posRef.current = { x: nx, y: ny }
      paint()

      const pointer = pointerRef.current
      if (!pointer || Math.hypot(pointer.x - nx, pointer.y - ny) > RADIUS) {
        fail()
        return
      }

      frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)
  }, [fail, paint, setPhaseSafe])

  const handlePointerMove = useCallback((e) => {
    const arena = arenaRef.current
    if (!arena) return
    const rect = arena.getBoundingClientRect()
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    pointerRef.current = point

    // Hover detection is a distance check rather than a DOM hover event: the
    // circle itself is pointer-events-none, so a fast cursor can never slip
    // between frames and desync the enter/leave pair.
    const inside = Math.hypot(point.x - posRef.current.x, point.y - posRef.current.y) <= RADIUS
    if (inside && (phaseRef.current === 'idle' || phaseRef.current === 'failed')) {
      startRound()
    }
  }, [startRound])

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null
    if (phaseRef.current === 'running') fail()
  }, [fail])

  const running = phase === 'running'
  const won = phase === 'won'

  return (
    <div
      ref={arenaRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="fixed inset-0 z-50 overflow-hidden bg-black select-none cursor-crosshair"
    >
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div
          className={
            'font-mono text-5xl font-bold tabular-nums tracking-tight text-red-500 transition-opacity duration-200 ' +
            (running ? 'opacity-100' : 'opacity-60')
          }
        >
          {formatClock(remaining)}
        </div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-600">
          {team} / {username} / attempt {attempts}
        </div>
      </div>

      {!won && (
        <div
          ref={circleRef}
          className={
            'absolute left-0 top-0 rounded-full pointer-events-none ' +
            (running ? 'bg-lime-400' : 'bg-neutral-300') +
            (phase === 'failed' ? ' ring-4 ring-red-500/60' : '')
          }
          style={{ width: RADIUS * 2, height: RADIUS * 2, transition: 'background-color 150ms ease-out' }}
        />
      )}

      {!running && !won && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center pointer-events-none px-6">
          <p className="text-sm text-neutral-400">
            {phase === 'failed'
              ? 'Cursor left the circle. Back to 1:00.'
              : 'Put your cursor on the circle to start.'}
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Keep it inside for a full minute. Leaving resets the clock.
          </p>
        </div>
      )}

      {won && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-lime-500/10 flex items-center justify-center">
            <IconCheck className="w-6 h-6 text-lime-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100">Cleared</h2>
          <p className="text-sm text-neutral-400">
            {team} held the circle for a full minute on attempt {attempts}.
          </p>
          <button
            type="button"
            onClick={() => {
              setAttempts(1)
              resetRound('idle')
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900 transition-colors"
          >
            <IconRefresh className="w-4 h-4" />
            Play again
          </button>
        </div>
      )}
    </div>
  )
}
