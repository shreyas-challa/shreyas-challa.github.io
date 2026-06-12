// Presentational rendering for an active-box writeup — the locked lock-screen
// and the unlocked writeup. Shared by box.jsx (the real /box/:slug page) and
// draft.jsx (the local preview), so what the user reviews matches production.

import { useMemo } from "react";
import { IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { renderContent } from "./render-content";

const GIBBERISH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// A FIXED decorative document skeleton, identical for every box and unrelated to
// the real writeup, so it leaks no structure. It just makes the locked state
// read as an encrypted document (headings / prose / a code block) instead of a
// raw blob. Lengths are character counts that produce ragged, prose-like lines.
const LOCKED_LAYOUT = [
  { type: "heading", lens: [22] },
  { type: "para", lens: [72, 70, 68, 41] },
  { type: "heading", lens: [16] },
  { type: "para", lens: [71, 69, 53] },
  { type: "code", lens: [38, 26, 51, 19] },
  { type: "para", lens: [72, 70, 31] },
];

function randStr(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += GIBBERISH_CHARS[Math.floor(Math.random() * GIBBERISH_CHARS.length)];
  return s;
}

function makeLockedDoc() {
  return LOCKED_LAYOUT.map((block) => ({ type: block.type, lines: block.lens.map(randStr) }));
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Unlocked writeup body. An optional `box` shows the machine icon + name header.
export function UnlockedWriteup({ doc, box }) {
  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="flex flex-col justify-center items-center w-full max-w-[800px] px-6 mt-12">
        {box?.cover && (
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src={box.cover}
              alt={box.name}
              className="w-[140px] h-[140px] rounded-2xl object-cover mb-4"
            />
            {box.name && <h1 className="text-3xl font-bold">{box.name}</h1>}
          </div>
        )}
        <div className="w-full">{renderContent(doc)}</div>
        <div className="h-[100px]" />
      </div>
    </div>
  );
}

// Locked lock-screen: machine name, unlock date, root-hash form, decoy document.
export function LockedWriteup({ box, hashInput, setHashInput, onUnlock, error, unlocking }) {
  const lockedDoc = useMemo(() => makeLockedDoc(), []);
  return (
    <div className="flex flex-col items-center w-full px-4 min-h-screen">
      <div className="w-full max-w-2xl pt-20 pb-24">
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          {box.cover ? (
            <img
              src={box.cover}
              alt={box.name}
              className="w-16 h-16 rounded-2xl object-cover border border-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center">
              <IconLock className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <h1 className="text-2xl font-bold">{box.name}</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            This box is active. The writeup is encrypted and unlocks on{" "}
            <span className="text-foreground font-medium">{formatDate(box.active_until)}</span>.
            To read it now, enter the box's root hash.
          </p>
        </div>

        <form onSubmit={onUnlock} className="flex flex-col sm:flex-row gap-3 mb-2">
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="Root hash"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 px-4 py-2 border rounded-lg bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <Button type="submit" className="sm:w-40" disabled={unlocking}>
            {unlocking ? "Unlocking..." : "Unlock"}
          </Button>
        </form>
        {error && <p className="text-sm text-red-500 text-center mb-2">{error}</p>}

        <div className="mt-10 select-none text-muted-foreground/40">
          {lockedDoc.map((block, i) => {
            if (block.type === "heading") {
              return (
                <h2 key={i} className="font-bold text-2xl mt-8 mb-4 break-all">
                  {block.lines[0]}
                </h2>
              );
            }
            if (block.type === "code") {
              return (
                <pre key={i} className="rounded-md border bg-muted p-4 text-sm overflow-auto my-4">
                  <code className="break-all">{block.lines.join("\n")}</code>
                </pre>
              );
            }
            return (
              <p key={i} className="mb-4 leading-relaxed break-all">
                {block.lines.join(" ")}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
