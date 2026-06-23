import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FloatingDock } from "./components/ui/floating-dock";
import { links, createLink } from "./links";
import { useAuth } from "./auth-context";
import { fetchBox } from "./data/boxes";
import { decryptContent } from "./lib/crypto";
import { LockedWriteup, UnlockedWriteup } from "./box-view";

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
      setError("Incorrect password. The writeup stays locked until you enter the correct secret.");
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

  return (
    <>
      {doc ? (
        <UnlockedWriteup doc={doc} box={box} />
      ) : (
        <LockedWriteup
          box={box}
          hashInput={hashInput}
          setHashInput={setHashInput}
          onUnlock={handleUnlock}
          error={error}
          unlocking={unlocking}
        />
      )}
      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </>
  );
}
