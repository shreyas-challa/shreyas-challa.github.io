import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPointFilled } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { BunkerGate, BunkerPage } from './components/bunker/bunker-shell'
import { bunkerCardClass } from './components/bunker/styles'
import {
  BACKSTOP_POLL_MS,
  BUNKER_COLUMNS,
  FALLBACK_POLL_MS,
  HISTORY_LIMIT,
  bunkerFeedConfigured,
  fetchBunkerEntries,
  subscribeToBunkerEntries,
} from './data/bunker-feed'

const STATUS_LABEL = {
  idle: 'Feed not configured',
  connecting: 'Connecting',
  live: 'Live',
  // Realtime is not carrying events, so the table is refreshing on a timer
  // instead. Entries still show up, just a few seconds later.
  polling: 'Polling',
  error: 'Feed unreachable',
}

const STATUS_DOT = {
  idle: 'text-muted-foreground/50',
  connecting: 'text-amber-500',
  live: 'text-lime-500',
  polling: 'text-amber-500',
  error: 'text-red-500',
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

// Folds rows in from either source, newest first, without duplicating an entry
// that arrived over Realtime and then again on a poll.
function mergeEntries(prev, incoming) {
  const byId = new Map(prev.map((row) => [row.id, row]))
  let changed = false
  for (const row of incoming) {
    if (byId.has(row.id)) continue
    byId.set(row.id, row)
    changed = true
  }
  if (!changed) return prev

  return [...byId.values()]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, HISTORY_LIMIT)
}

// Loads the recent entries and keeps them current from two directions: rows
// pushed over Realtime land the moment they arrive, and a timer re-reads the
// table as a backstop. See the note on the poll intervals in bunker-feed.js.
function useBunkerEntries() {
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('connecting')

  // The newest created_at present when the page opened. Anything stamped later
  // than this arrived while someone was watching, so it earns a flash. Both
  // sides of the comparison are server timestamps, which keeps a client clock
  // that is off by a minute from lighting up the whole table.
  const baseline = useRef(null)

  const addEntry = useCallback((entry) => {
    setEntries((prev) => mergeEntries(prev, [entry]))
  }, [])

  const isFresh = useCallback(
    (entry) => baseline.current !== null && entry.created_at > baseline.current,
    [],
  )

  useEffect(() => {
    let cancelled = false
    let timer = 0
    // These are read inside the timer, so rescheduling does not depend on a
    // re-render having happened first.
    //
    // Every id the page has already seen, and whether the socket was the one
    // that brought it. A poll turning up a row the socket never delivered is
    // the evidence that Realtime is not carrying events; silence is not, since
    // a quiet table looks identical to a broken one.
    const knownIds = new Set()
    const pushedIds = new Set()
    let realtimeMissed = false

    // Subscribe before the first read so a row inserted mid-fetch is not lost
    // in the gap between the two.
    const stop = subscribeToBunkerEntries({
      onInsert: (entry) => {
        if (cancelled) return
        knownIds.add(entry.id)
        pushedIds.add(entry.id)
        // A delivery clears a previous miss: whatever the socket was doing, it
        // is carrying events again.
        realtimeMissed = false
        setStatus('live')
        addEntry(entry)
      },
      onStatus: (next) => {
        if (cancelled) return
        if (next === 'error') {
          // The socket is down, but reads may well be fine. Call that polling
          // and let a failed read be the only thing that reports a dead feed.
          realtimeMissed = true
          setStatus('polling')
          return
        }
        setStatus((prev) => (next === 'live' && realtimeMissed ? prev : next))
      },
    })

    async function read({ scheduleNext }) {
      try {
        const rows = await fetchBunkerEntries()
        if (cancelled) return

        const firstRead = baseline.current === null
        // Rows are newest-first, so the first one is the high-water mark. An
        // empty table leaves the epoch, making every later arrival fresh.
        if (firstRead) baseline.current = rows[0]?.created_at ?? ''

        const missed = rows.filter((row) => !knownIds.has(row.id) && !pushedIds.has(row.id))
        for (const row of rows) knownIds.add(row.id)

        setEntries((prev) => mergeEntries(prev, rows))

        // Rows on the table at open are not a miss; only ones that appeared
        // after the page was already listening.
        if (!firstRead && missed.length > 0) realtimeMissed = true
        if (realtimeMissed) setStatus('polling')
        // A read that succeeds after a failed one means the feed is back, by
        // the poll at least; the socket says so itself when it resubscribes.
        else setStatus((prev) => (prev === 'error' ? 'polling' : prev))
      } catch {
        if (!cancelled && bunkerFeedConfigured) setStatus('error')
      } finally {
        if (!cancelled && scheduleNext) {
          // A tab in the background gets the slow interval either way; there is
          // nobody watching it, and it re-reads as soon as it comes back.
          const idle = typeof document !== 'undefined' && document.hidden
          const wait = realtimeMissed && !idle ? FALLBACK_POLL_MS : BACKSTOP_POLL_MS
          timer = setTimeout(() => read({ scheduleNext: true }), wait)
        }
      }
    }

    read({ scheduleNext: true })

    // Coming back to the tab should show the current table immediately rather
    // than after the next tick.
    const onVisible = () => {
      if (!document.hidden) read({ scheduleNext: false })
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      stop()
    }
  }, [addEntry])

  return { entries, status, isFresh }
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const Dash = () => <span className="text-muted-foreground/40">&mdash;</span>

// A one-shot flash on a row that arrived while you were watching. Rows are
// keyed by id, so an arriving row is a fresh mount: it starts lit and fades,
// rather than reacting to a prop change that never comes. Rows already on the
// table at open are not fresh and never flash.
function useMountFlash(fresh) {
  const [flash, setFlash] = useState(fresh)

  useEffect(() => {
    if (!fresh) return
    const timer = setTimeout(() => setFlash(false), 900)
    return () => clearTimeout(timer)
  }, [fresh])

  return fresh && flash
}

function EntryRow({ entry, fresh }) {
  const flash = useMountFlash(fresh)
  const receivedAt = entry.created_at ? new Date(entry.created_at) : null

  return (
    <tr
      className={cn(
        'border-t border-border transition-colors duration-700',
        flash && 'bg-lime-500/10 duration-100',
      )}
    >
      {BUNKER_COLUMNS.map(({ key }, i) => {
        const formatted = formatValue(entry[key])
        return (
          <td
            key={key}
            className={cn(
              'py-4 px-5 font-mono text-base tabular-nums',
              i === 0 ? 'pl-6 text-left' : 'text-right',
            )}
          >
            {formatted ?? <Dash />}
          </td>
        )
      })}
      <td className="py-4 pl-5 pr-6 text-right font-mono text-sm tabular-nums text-muted-foreground">
        {receivedAt ? timeFormat.format(receivedAt) : <Dash />}
      </td>
    </tr>
  )
}

// The placeholder that holds the table's shape before the first entry lands.
// It is replaced by real rows, never shown alongside them.
function EmptyRow() {
  return (
    <tr className="border-t border-border">
      {BUNKER_COLUMNS.map(({ key }, i) => (
        <td
          key={key}
          className={cn('py-4 px-5 text-base', i === 0 ? 'pl-6 text-left' : 'text-right')}
        >
          <Dash />
        </td>
      ))}
      <td className="py-4 pl-5 pr-6 text-right text-sm">
        <Dash />
      </td>
    </tr>
  )
}

function BunkerTable() {
  const { entries, status, isFresh } = useBunkerEntries()

  return (
    <>
      <div className="flex items-center justify-between w-full mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Bunker</h1>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconPointFilled className={cn('w-3.5 h-3.5', STATUS_DOT[status])} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className={`w-full overflow-hidden ${bunkerCardClass}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {BUNKER_COLUMNS.map(({ key, label }, i) => (
                <th
                  key={key}
                  className={cn(
                    'py-3.5 px-5 text-sm font-medium text-muted-foreground',
                    i === 0 ? 'pl-6 text-left' : 'text-right',
                  )}
                >
                  {label}
                </th>
              ))}
              <th className="py-3.5 pl-5 pr-6 text-right text-sm font-medium text-muted-foreground">
                Received
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <EmptyRow />
            ) : (
              entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} fresh={isFresh(entry)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground/70">
        {entries.length === 0
          ? 'No entries yet. Rows appear here the moment one is submitted.'
          : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}, newest first`}
      </p>
    </>
  )
}

export default function Bunker() {
  return (
    <BunkerGate title="Bunker">
      <BunkerPage
        width="max-w-2xl"
        footer={
          <Link
            to="/bunker/submit"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Submit an entry
          </Link>
        }
      >
        <BunkerTable />
      </BunkerPage>
    </BunkerGate>
  )
}
