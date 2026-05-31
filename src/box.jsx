import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IconLock, IconLockOpen } from "@tabler/icons-react";
import { FloatingDock } from "./components/ui/floating-dock";
import { Button } from "@/components/ui/button";
import { links, createLink } from "./links";
import { useAuth } from "./auth-context";
import { fetchBox } from "./data/boxes";
import { decryptContent } from "./lib/crypto";
import { renderContent } from "./render-content";

const GIBBERISH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Fixed-size decorative gibberish — deliberately NOT the real ciphertext, so its
// size reveals nothing about the writeup's length or structure.
function makeGibberish() {
  const lines = [];
  for (let l = 0; l < 14; l++) {
    let line = "";
    for (let c = 0; c < 72; c++) {
      line += GIBBERISH_CHARS[Math.floor(Math.random() * GIBBERISH_CHARS.length)];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function Box() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState(null);      // decrypted writeup JSON string
  const [hashInput, setHashInput] = useState("");
  const [error, setError] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  const gibberish = useMemo(() => makeGibberish(), []);

  useEffect(() => {
    let cancelled = false;
    fetchBox(slug).then(async (data) => {
      if (cancelled) return;
      setBox(data);
      // Retired box: the endpoint released the secret, so auto-decrypt.
      if (data && !data.locked && data.secret) {
        try {
          setDoc(await decryptContent(data.encrypted, data.secret));
        } catch {
          /* leave locked view as a fallback */
        }
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links;

  async function handleUnlock(e) {
    e.preventDefault();
    setError(null);
    setUnlocking(true);
    try {
      const plaintext = await decryptContent(box.encrypted, hashInput.trim());
      setDoc(plaintext);
    } catch {
      setError("Incorrect root hash. The writeup stays locked until you provide the correct one.");
    } finally {
      setUnlocking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <h1 className="text-3xl font-bold mb-4">Box not found</h1>
        <button onClick={() => navigate("/")} className="text-blue-500 underline">Go home</button>
        <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
          <FloatingDock items={dockLinks} />
        </div>
      </div>
    );
  }

  // Unlocked (correct hash entered, or box retired): render the real writeup.
  if (doc) {
    return (
      <div className="flex flex-col justify-center items-center w-full">
        <div className="flex flex-col justify-center items-center w-full max-w-[800px] px-6 mt-12">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-6">
            <IconLockOpen className="w-4 h-4" />
            <span>Unlocked</span>
          </div>
          <div className="w-full">
            {renderContent(doc)}
          </div>
          <div className="h-[100px]" />
        </div>
        <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
          <FloatingDock items={dockLinks} />
        </div>
      </div>
    );
  }

  // Locked: active box. Show nothing derived from the writeup itself — only the
  // public machine name and the unlock date.
  return (
    <div className="flex flex-col items-center w-full px-4 min-h-screen">
      <div className="w-full max-w-2xl pt-20 pb-24">
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center">
            <IconLock className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{box.name}</h1>
          <p className="text-sm text-muted-foreground max-w-md">
            This box is active. The writeup is encrypted and unlocks on{" "}
            <span className="text-foreground font-medium">{formatDate(box.active_until)}</span>.
            To read it now, enter the box's root hash.
          </p>
        </div>

        <div className="relative rounded-xl border border-border bg-card overflow-hidden">
          <pre className="select-none break-all whitespace-pre-wrap p-5 text-xs leading-relaxed text-muted-foreground/50 blur-[1.5px] max-h-64 overflow-hidden font-mono">
            {gibberish}
          </pre>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        </div>

        <form onSubmit={handleUnlock} className="mt-6 flex flex-col gap-3">
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="Root hash"
            autoComplete="off"
            spellCheck={false}
            className="w-full px-4 py-2 border rounded-lg bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <Button type="submit" className="w-full" disabled={unlocking}>
            {unlocking ? "Unlocking..." : "Unlock writeup"}
          </Button>
        </form>
      </div>

      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  );
}
