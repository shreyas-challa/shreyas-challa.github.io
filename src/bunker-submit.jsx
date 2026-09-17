import { useState } from 'react'
import { IconAlertTriangle, IconCheck, IconSend } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { BunkerGate, BunkerPage } from './components/bunker/bunker-shell'
import { bunkerCardClass, bunkerInputClass } from './components/bunker/styles'
import { BUNKER_COLUMNS, bunkerFeedConfigured } from './data/bunker-feed'
import { sendToBunker } from './send-to-bunker'

const emptyForm = () => Object.fromEntries(BUNKER_COLUMNS.map(({ key }) => [key, '']))

function SubmitForm() {
  const [values, setValues] = useState(emptyForm)
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState(null)
  const [error, setError] = useState(null)

  // Any one of the three is enough to send; a partial entry shows as a dash on
  // the table rather than being rejected here.
  const canSubmit =
    !sending && bunkerFeedConfigured && Object.values(values).some((v) => v.trim() !== '')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setSending(true)
    setError(null)
    try {
      await sendToBunker(values)
      setValues(emptyForm())
      setSentAt(Date.now())
    } catch (err) {
      setError(err?.message ?? 'Could not send that entry.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Submit</h1>

      <div className={`p-8 ${bunkerCardClass}`}>
        <p className="text-sm text-muted-foreground">
          Sending an entry adds a row to the bunker table on every screen that has it open.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mt-6">
          {BUNKER_COLUMNS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label htmlFor={`bunker-${key}`} className="text-xs font-medium text-muted-foreground">
                {label}
              </label>
              <input
                id={`bunker-${key}`}
                type="text"
                value={values[key]}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, [key]: e.target.value }))
                  if (sentAt) setSentAt(null)
                  if (error) setError(null)
                }}
                autoComplete="off"
                spellCheck={false}
                className={bunkerInputClass}
              />
            </div>
          ))}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full mt-2 bg-lime-500 text-lime-950 hover:bg-lime-400 dark:bg-lime-500 dark:text-lime-950 dark:hover:bg-lime-400"
          >
            <IconSend className="w-4 h-4" />
            {sending ? 'Sending' : 'Send entry'}
          </Button>
        </form>

        {!bunkerFeedConfigured && (
          <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 mt-4">
            <IconAlertTriangle className="w-4 h-4 shrink-0" />
            This build has no Supabase credentials, so nothing can be sent.
          </p>
        )}

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-500 mt-4" role="alert">
            <IconAlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}

        {sentAt && !error && (
          <p className="flex items-center gap-1.5 text-sm text-lime-600 dark:text-lime-400 mt-4">
            <IconCheck className="w-4 h-4 shrink-0" />
            Sent. It is on the table now.
          </p>
        )}
      </div>
    </>
  )
}

export default function BunkerSubmit() {
  return (
    <BunkerGate title="Bunker">
      <BunkerPage width="max-w-md">
        <SubmitForm />
      </BunkerPage>
    </BunkerGate>
  )
}
