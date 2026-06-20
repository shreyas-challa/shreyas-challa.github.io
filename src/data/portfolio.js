export const projects = [
  {
    name: 'Xia',
    description: 'Ahead-of-time compiled programming language with Pythonic indentation syntax and automatic reference counting instead of a garbage collector. The compiler is written in Rust and emits native binaries through LLVM 18, with a zero-cost C FFI.',
    language: 'Rust',
    url: 'https://github.com/shreyas-challa/xia',
    tags: ['Compilers', 'Systems', 'Rust'],
  },
  {
    name: 'Lacuna',
    description: 'Autonomous pentesting agent with a real-time D3 attack graph. Multi-backend LLM orchestrates enumeration, exploitation, and privilege escalation to root with safety guardrails.',
    language: 'Python',
    url: 'https://github.com/shreyas-challa/lacuna',
    tags: ['AI', 'Security', 'Pentesting'],
  },
  {
    name: 'WiFie',
    description: 'Wi-Fi 6/6E/7 pentesting console for controlled lab work. Rust drives nl80211 and pcap directly, with no airmon-ng wrappers, and a browser SPA renders live telemetry on canvas.',
    language: 'Rust',
    url: 'https://github.com/shreyas-challa/wifie',
    tags: ['Security', 'Wireless', 'Systems'],
  },
  {
    name: 'SecGen-AI',
    description: 'LLM-powered security research agent. Assists with vulnerability analysis, payload reasoning, and CVE triage using tool-use. A research copilot, not an autonomous attacker.',
    language: 'Python',
    url: 'https://github.com/shreyas-challa/SecGen-ai',
    tags: ['AI', 'Security', 'Research'],
  },
  {
    name: 'Fitrack',
    description: 'Personal iOS workout tracker for hybrid training: PPL lifts plus Z2 and interval cardio. SwiftUI + SwiftData, Swift Charts for stats, zero third-party dependencies.',
    language: 'Swift',
    url: 'https://github.com/shreyas-challa/fitrack',
    tags: ['iOS', 'SwiftUI', 'Fitness'],
  },
  {
    name: 'Phil Swipe',
    description: 'Interactive philosophy widget for your phone. Replaces the social-media unlock reflex with a daily thought-provoking idea, counterarguments, and follow-up prompts.',
    language: 'JavaScript',
    url: 'https://github.com/shreyas-challa/phil-swipe',
    tags: ['Mobile', 'AI', 'Philosophy'],
  },
  {
    name: 'Malware Lab',
    description: 'A research repository exploring offensive malware development techniques in C: process injection, shellcode loaders, API hooking, and evasion. Built for controlled lab study of how modern Windows implants operate.',
    language: 'C',
    url: 'https://github.com/shreyas-challa/malware',
    tags: ['Security', 'Low-Level', 'Research'],
  },
  {
    name: 'DevDigest',
    description: 'A curated daily digest for developers focused on opinions, ideas, and insights, not tutorials. Aggregates from HN, Reddit, and curated blogs.',
    language: 'Python',
    url: 'https://github.com/shreyas-challa/DevDigest',
    tags: ['CLI', 'Productivity', 'News'],
  },
]

export const cves = [
  {
    id: 'CVE-2026-46395',
    product: 'HAXcms (Node.js)',
    summary: 'Private key disclosure via broken HMAC implementation, allowing unauthenticated attackers to forge admin JWTs.',
    status: 'Published',
    advisoryUrl: 'https://www.cve.org/CVERecord?id=CVE-2026-46395',
    writeupUrl: null,
    pocUrl: null,
  },
  {
    id: 'CVE-2026-46394',
    product: 'HAXcms (PHP)',
    summary: 'OS command injection in the Git.php library via unsanitized parameters passed to proc_open(), enabling arbitrary command execution.',
    status: 'Published',
    advisoryUrl: 'https://www.cve.org/CVERecord?id=CVE-2026-46394',
    writeupUrl: null,
    pocUrl: null,
  },
]

export const statusStyles = {
  Published: 'bg-green-500/15 text-green-600 dark:text-green-400',
  Reserved: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
}

// Lower = ranked higher. Used to break ties when search scores are equal so
// Published CVEs surface above Reserved ones (instead of falling back to the
// incidental CVE-number ordering).
export const statusOrder = {
  Published: 0,
  Reserved: 1,
}

export const langColors = {
  Python: 'bg-blue-500',
  C: 'bg-indigo-500',
  Rust: 'bg-orange-600',
  Swift: 'bg-orange-500',
  JavaScript: 'bg-yellow-400',
}
