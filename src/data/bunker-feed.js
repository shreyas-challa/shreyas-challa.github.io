// The data source behind the /bunker table.
//
// Nothing here is wired to a real service yet. Point VITE_BUNKER_FEED_URL at
// the endpoint once it exists and the table starts filling in on its own; no
// change to the page is needed. Two transports are supported:
//
//   poll   (default) — GET the URL on an interval, read the three values off
//                      the JSON body.
//   stream           — hold a Server-Sent Events connection open and take each
//                      message as it lands. Use this when the endpoint pushes.
//
// Pick one with VITE_BUNKER_FEED_MODE=poll | stream.
export const BUNKER_FEED_URL = import.meta.env.VITE_BUNKER_FEED_URL ?? ''
export const BUNKER_FEED_MODE = import.meta.env.VITE_BUNKER_FEED_MODE ?? 'poll'

const POLL_MS = 2000

// The three variables the table shows, in display order. `key` is what the
// endpoint is expected to call them; rename these to match the real payload
// rather than translating in the page.
export const BUNKER_FIELDS = [
  { key: 'alpha', label: 'Alpha' },
  { key: 'bravo', label: 'Bravo' },
  { key: 'charlie', label: 'Charlie' },
]

// Accepts the shapes a small JSON endpoint is likely to return and flattens
// them to { key: value }. Anything unrecognised comes back empty, which the
// page reads as "still waiting" rather than an error.
function normalize(payload) {
  if (!payload || typeof payload !== 'object') return {}

  // [{ key, value }, ...]
  if (Array.isArray(payload)) {
    return Object.fromEntries(
      payload
        .filter((row) => row && row.key != null)
        .map((row) => [String(row.key), row.value]),
    )
  }

  // { values: {...} } / { data: {...} } / { alpha: ..., bravo: ... }
  const body = payload.values ?? payload.data ?? payload
  if (!body || typeof body !== 'object') return {}

  const out = {}
  for (const { key } of BUNKER_FIELDS) {
    if (key in body) out[key] = body[key]
  }
  return out
}

// Starts the feed. `onValues(values)` fires with a partial { key: value } map
// every time a payload arrives — the page timestamps each key at that moment,
// so a field that arrives late is stamped late. `onStatus(status)` reports
// 'idle' | 'connecting' | 'live' | 'error'.
//
// Returns a stop function. Safe to call with no URL configured: it settles on
// 'idle' and never touches the network.
export function subscribeToBunkerFeed({ onValues, onStatus }) {
  if (!BUNKER_FEED_URL) {
    onStatus('idle')
    return () => {}
  }

  if (BUNKER_FEED_MODE === 'stream') {
    onStatus('connecting')
    const source = new EventSource(BUNKER_FEED_URL)

    source.onopen = () => onStatus('live')
    source.onmessage = (event) => {
      try {
        onValues(normalize(JSON.parse(event.data)))
        onStatus('live')
      } catch {
        onStatus('error')
      }
    }
    // EventSource reconnects on its own, so an error is a blip to report, not
    // a reason to tear the connection down.
    source.onerror = () => onStatus('error')

    return () => source.close()
  }

  let stopped = false
  let timer = 0
  onStatus('connecting')

  async function tick() {
    try {
      const res = await fetch(BUNKER_FEED_URL, { cache: 'no-store' })
      if (!res.ok) throw new Error(`feed responded ${res.status}`)
      const values = normalize(await res.json())
      if (stopped) return
      onValues(values)
      onStatus('live')
    } catch {
      if (!stopped) onStatus('error')
    } finally {
      if (!stopped) timer = setTimeout(tick, POLL_MS)
    }
  }

  tick()

  return () => {
    stopped = true
    clearTimeout(timer)
  }
}
