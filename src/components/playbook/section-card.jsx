import { useState } from 'react'
import {
  IconChevronDown,
  IconTerminal2,
  IconBrandWindows,
  IconRouter,
  IconAlertTriangle,
  IconBan,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { CopyBlock } from './copy-block'

function machineMeta(os) {
  if (os?.toLowerCase().includes('windows')) {
    return { Icon: IconBrandWindows, classes: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' }
  }
  if (os?.toLowerCase().includes('opnsense')) {
    return { Icon: IconRouter, classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' }
  }
  return { Icon: IconTerminal2, classes: 'bg-lime-500/10 text-lime-700 dark:text-lime-400' }
}

function LevelDots({ level }) {
  const n = Number(level.replace('L', ''))
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            i <= n ? 'bg-lime-500 dark:bg-lime-400' : 'bg-muted-foreground/20',
          )}
        />
      ))}
    </div>
  )
}

function LevelRow({ lvl }) {
  if (lvl.disabled) {
    return (
      <div className="py-4 pl-4 border-l-2 border-dashed border-destructive/40 opacity-70">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {lvl.level}
          </span>
          <LevelDots level={lvl.level} />
          <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium ml-auto">
            <IconBan className="w-3.5 h-3.5" /> Do not use
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{lvl.why}</p>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {lvl.level}
        </span>
        <LevelDots level={lvl.level} />
        <span className="text-sm font-medium">{lvl.action}</span>
      </div>

      <div className="grid gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
            Command
          </div>
          <CopyBlock text={lvl.command} />
        </div>

        {lvl.why && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
              Why the check goes red
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{lvl.why}</p>
          </div>
        )}

        {lvl.revert && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
              Revert
            </div>
            <CopyBlock text={lvl.revert} muted />
          </div>
        )}
      </div>
    </div>
  )
}

// One scored-check service block: header (checks, targets, machines,
// description, optional warning) plus its L1-L5 escalation ladder, filtered
// down to `activeLevel` when the level filter isn't "all". Level rows share a
// divider instead of each getting its own bordered box, so a page of fifteen
// services doesn't read as a wall of nested cards.
export function SectionCard({ section, activeLevel, machines }) {
  const [open, setOpen] = useState(true)
  const levels = activeLevel === 'all' ? section.levels : section.levels.filter((l) => l.level === activeLevel)

  return (
    <div className="rounded-2xl bg-card p-5 sm:p-6 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_2px_8px_0_rgba(0,0,0,0.2)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.checks.map((c) => (
              <span key={c} className="text-xs font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {c}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {section.machines.map((m) => {
              const { Icon, classes } = machineMeta(machines[m]?.os)
              return (
                <span
                  key={m}
                  className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full', classes)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m}
                  {machines[m]?.ip && <span className="font-mono opacity-70">· {machines[m].ip}</span>}
                </span>
              )
            })}
          </div>

          {section.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
          )}

          {section.warning && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <IconAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{section.warning}</span>
            </div>
          )}
        </div>

        <IconChevronDown
          className={cn('w-5 h-5 text-muted-foreground shrink-0 transition-transform mt-1', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="divide-y divide-border/60 mt-1">
          {levels.map((lvl) => (
            <LevelRow key={lvl.level} lvl={lvl} />
          ))}
          {levels.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">No level matches the current filter.</p>
          )}
        </div>
      )}
    </div>
  )
}
