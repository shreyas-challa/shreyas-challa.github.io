// Shared class strings for the bunker pages. They live apart from the
// components so the component file exports only components and fast refresh
// keeps working.

// Card surface: the layered light/dark shadow stacks from DESIGN_SYSTEM.md §5.
export const bunkerCardClass =
  'rounded-2xl border border-border bg-card ' +
  'shadow-[rgba(17,24,28,0.08)_0_0_0_1px,rgba(17,24,28,0.08)_0_1px_2px_-1px,rgba(17,24,28,0.04)_0_2px_4px] ' +
  'dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_0_rgba(0,0,0,0.1),0_4px_4px_0_rgba(0,0,0,0.1),0_8px_8px_0_rgba(0,0,0,0.1)]'

export const bunkerInputClass =
  'w-full h-10 px-3 rounded-lg bg-muted/50 dark:bg-white/[0.04] text-sm ' +
  'placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-lime-500/40'
