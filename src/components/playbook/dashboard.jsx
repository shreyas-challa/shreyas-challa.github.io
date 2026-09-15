import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { IconSearch, IconX, IconLock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SectionCard } from './section-card'
import { NotesPanel } from './notes-panel'

const LEVELS = ['all', 'L1', 'L2', 'L3', 'L4', 'L5']

function sectionSearchBlob(section) {
  return [
    section.title,
    ...section.checks,
    ...section.targets,
    ...section.machines,
    section.description,
    section.warning,
    ...section.levels.flatMap((l) => [l.action, l.command, l.why, l.revert]),
  ]
    .filter(Boolean)
    .join(' \n ')
}

export function PlaybookDashboard({ data, onLock }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [machine, setMachine] = useState('all')

  const machineOptions = useMemo(() => {
    const set = new Set()
    data.sections.forEach((s) => s.machines.forEach((m) => set.add(m)))
    return Array.from(set)
  }, [data.sections])

  const searchable = useMemo(
    () => data.sections.map((s) => ({ ...s, blob: sectionSearchBlob(s) })),
    [data.sections],
  )

  const fuse = useMemo(
    () => new Fuse(searchable, { keys: ['title', 'blob'], threshold: 0.3, ignoreLocation: true }),
    [searchable],
  )

  const filtered = useMemo(() => {
    let list = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : data.sections
    if (machine !== 'all') list = list.filter((s) => s.machines.includes(machine))
    return list
  }, [query, fuse, data.sections, machine])

  return (
    <div className="w-full max-w-4xl px-4 sm:px-6 pt-10 pb-32">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{data.meta.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-lime-600 dark:text-lime-400 font-semibold">{data.meta.scoredChecksTotal}</span> scored checks ·{' '}
            <span className="text-lime-600 dark:text-lime-400 font-semibold">{data.sections.length}</span> services ·{' '}
            <span className="text-lime-600 dark:text-lime-400 font-semibold">{machineOptions.length}</span> machines · IPs use{' '}
            <code className="font-mono">{'{N}'}</code> = your team number
          </p>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-full px-3 py-1.5 transition-colors shrink-0"
        >
          <IconLock className="w-3.5 h-3.5" /> Lock
        </button>
      </div>

      <div className="relative mb-4">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services, machines, checks, commands..."
          spellCheck={false}
          autoComplete="off"
          className={cn(
            'w-full h-11 pl-11 pr-10 rounded-full bg-muted/50 dark:bg-white/[0.04] text-sm',
            'focus:outline-none focus:ring-2 focus:ring-lime-500/40',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <IconX className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {LEVELS.map((l) => (
          <Button
            key={l}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLevel(l)}
            className={cn(
              'rounded-full',
              level === l
                ? 'bg-lime-500/15 text-lime-700 dark:text-lime-400 font-semibold hover:bg-lime-500/20'
                : 'text-muted-foreground',
            )}
          >
            {l === 'all' ? 'All levels' : l}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-8">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setMachine('all')}
          className={cn(
            'rounded-full',
            machine === 'all' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400 font-semibold hover:bg-sky-500/20' : 'text-muted-foreground',
          )}
        >
          All machines
        </Button>
        {machineOptions.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setMachine(m)}
            className={cn(
              'rounded-full',
              machine === m ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400 font-semibold hover:bg-sky-500/20' : 'text-muted-foreground',
            )}
          >
            {m}
          </Button>
        ))}
      </div>

      <div className="mb-8">
        <NotesPanel meta={data.meta} />
      </div>

      <div className="grid gap-5">
        {filtered.map((section) => (
          <SectionCard key={section.id} section={section} activeLevel={level} machines={data.machines} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No services match "{query}".</p>
        )}
      </div>
    </div>
  )
}
