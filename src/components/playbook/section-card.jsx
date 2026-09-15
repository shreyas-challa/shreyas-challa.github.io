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

function machineIcon(os) {
  if (!os) return IconTerminal2
  if (os.toLowerCase().includes('windows')) return IconBrandWindows
  if (os.toLowerCase().includes('opnsense')) return IconRouter
  return IconTerminal2
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
            i <= n ? 'bg-foreground/70' : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

function LevelRow({ lvl }) {
  if (lvl.disabled) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 opacity-60">
        <div className="flex items-center gap-2 mb-2">
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
    <div className="rounded-xl border border-border p-4">
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
// description, optional warning) plus its L1–L5 escalation ladder, filtered
// down to `activeLevel` when the level filter isn't "all".
export function SectionCard({ section, activeLevel, machines }) {
  const [open, setOpen] = useState(true)
  const levels = activeLevel === 'all' ? section.levels : section.levels.filter((l) => l.level === activeLevel)

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 sm:p-6',
        'shadow-[rgba(17,24,28,0.08)_0_0_0_1px,rgba(17,24,28,0.06)_0_1px_2px_-1px,rgba(17,24,28,0.03)_0_2px_4px]',
        'dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.15),0_2px_2px_0_rgba(0,0,0,0.15)]',
      )}
    >
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
              const Icon = machineIcon(machines[m]?.os)
              return (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-border text-muted-foreground"
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
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
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
        <div className="grid gap-3 mt-4">
          {levels.map((lvl) => (
            <LevelRow key={lvl.level} lvl={lvl} />
          ))}
          {levels.length === 0 && (
            <p className="text-sm text-muted-foreground">No level matches the current filter.</p>
          )}
        </div>
      )}
    </div>
  )
}
