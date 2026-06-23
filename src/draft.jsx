// Local-only review page for an imported writeup draft (dev server only).
//
// Loads drafts/<slug>.json + .meta.json via the dev draft API, and lets you:
//   - Rendered : see it exactly as a reader would (renderContent)
//   - Edit     : tweak text/images inline; Save persists back to the draft files
//   - Locked   : (box target) encrypt in-browser with the root hash and preview
//                the real lock screen + unlock flow
// Structural changes (re-describing a screenshot, reordering) go back to Claude
// Code, which edits the same draft files — one source of truth.

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { renderContent } from "./render-content";
import { WriteupEditor } from "./components/writeup-editor";
import { LockedWriteup, UnlockedWriteup } from "./box-view";
import { encryptContent, decryptContent } from "./lib/crypto";
import { supabase } from "./database";
import { useAuth } from "./auth-context";

// data:image/png;base64,... -> File, so we can push it to Supabase storage.
function dataUriToFile(dataUri, name) {
  const [head, b64] = dataUri.split(",");
  const mime = head.match(/data:([^;]+)/)?.[1] || "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

async function uploadDataUri(dataUri, name) {
  const file = dataUriToFile(dataUri, name);
  const ext = file.type.split("/")[1] || "png";
  const fileName = `content/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("blog-images").upload(fileName, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("blog-images").getPublicUrl(fileName).data.publicUrl;
}

// Upload every inline base64 screenshot to storage and swap in hosted URLs, so
// the published row stays small. Mutates a copy of the doc; returns it.
async function hostImages(doc) {
  const clone = JSON.parse(JSON.stringify(doc));
  const nodes = clone.content || [];
  for (const node of nodes) {
    if (node.type === "image" && node.attrs?.src?.startsWith("data:")) {
      node.attrs.src = await uploadDataUri(node.attrs.src, node.attrs.alt || "screenshot");
    }
  }
  return clone;
}

function CoverHeader({ meta }) {
  return (
    <div className="flex flex-col items-center text-center mt-8 mb-8">
      {meta.cover && (
        <img
          src={meta.cover}
          alt={meta.name || meta.title}
          className="w-[160px] h-[160px] rounded-2xl object-cover mb-6"
        />
      )}
      <h1 className="text-4xl font-bold">{meta.title || meta.name}</h1>
      {meta.subtitle && <p className="text-lg text-muted-foreground mt-2">{meta.subtitle}</p>}
    </div>
  );
}

// Inline-editable title/subtitle for Edit mode (mirrors the /create header).
// Changes update meta; Save draft persists them.
function EditableHeader({ meta, setMeta, coverInputRef }) {
  return (
    <div className="flex flex-col items-center text-center mt-8 mb-8">
      {meta.cover ? (
        <img
          src={meta.cover}
          alt={meta.name || meta.title}
          className="w-[160px] h-[160px] rounded-2xl object-cover mb-6 cursor-pointer"
          onClick={() => coverInputRef.current?.click()}
          title="Click to replace the cover"
        />
      ) : (
        <button
          onClick={() => coverInputRef.current?.click()}
          className="w-[160px] h-[160px] rounded-2xl border-2 border-dashed border-muted-foreground/25 mb-6 text-xs text-muted-foreground/50 hover:border-muted-foreground/40 cursor-pointer"
        >
          Add cover
        </button>
      )}
      <input
        type="text"
        value={meta.title || ""}
        onChange={(e) => setMeta({ ...meta, title: e.target.value })}
        placeholder="Title"
        className="w-full text-4xl font-bold text-center bg-transparent border-none outline-none placeholder:text-muted-foreground/25"
      />
      <input
        type="text"
        value={meta.subtitle || ""}
        onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })}
        placeholder="Add a subtitle..."
        className="w-full text-lg text-muted-foreground text-center mt-2 bg-transparent border-none outline-none placeholder:text-muted-foreground/25"
      />
    </div>
  );
}

// Box target: encrypt the current doc with the secret and preview the real lock
// screen, including the unlock flow visitors use.
function LockedPreview({ doc, meta }) {
  const [encrypted, setEncrypted] = useState(null);
  const [hashInput, setHashInput] = useState("");
  const [unlockedDoc, setUnlockedDoc] = useState(null);
  const [error, setError] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUnlockedDoc(null);
    setEncrypted(null);
    setError(null);
    if (!meta.secret) {
      setError("Set a root hash (secret) in the meta panel to preview the locked box.");
      return;
    }
    encryptContent(JSON.stringify(doc), meta.secret).then((enc) => {
      if (!cancelled) setEncrypted(enc);
    });
    return () => { cancelled = true; };
  }, [doc, meta.secret]);

  async function handleUnlock(e) {
    e.preventDefault();
    setError(null);
    setUnlocking(true);
    try {
      setUnlockedDoc(await decryptContent(encrypted, hashInput.trim()));
    } catch {
      setError("Incorrect root hash. The writeup stays locked until you provide the correct one.");
    } finally {
      setUnlocking(false);
    }
  }

  if (unlockedDoc) return <UnlockedWriteup doc={unlockedDoc} />;
  if (!encrypted) {
    return <p className="text-center text-muted-foreground mt-12">{error || "Encrypting preview..."}</p>;
  }
  return (
    <LockedWriteup
      box={{ name: meta.name || meta.title, active_until: meta.active_until, cover: meta.cover }}
      hashInput={hashInput}
      setHashInput={setHashInput}
      onUnlock={handleUnlock}
      error={error}
      unlocking={unlocking}
    />
  );
}

const META_FIELDS = [
  { key: "title", label: "Title", type: "text" },
  { key: "name", label: "Machine name", type: "text" },
  { key: "subtitle", label: "Subtitle", type: "text" },
  { key: "secret", label: "Root hash (box secret)", type: "text" },
  { key: "active_until", label: "Unlocks on (box)", type: "text" },
  { key: "cover", label: "Cover image URL", type: "text" },
];

function MetaPanel({ meta, setMeta }) {
  return (
    <div className="border rounded-lg p-4 mb-6 bg-muted/30">
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm font-medium">Target</label>
        <select
          value={meta.target || "box"}
          onChange={(e) => setMeta({ ...meta, target: e.target.value })}
          className="border rounded-md px-2 py-1 text-sm bg-background"
        >
          <option value="box">Encrypted box</option>
          <option value="post">Regular post</option>
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {META_FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{f.label}</span>
            <input
              type={f.type}
              value={meta[f.key] || ""}
              onChange={(e) => setMeta({ ...meta, [f.key]: e.target.value })}
              className="border rounded-md px-2 py-1 bg-background font-mono text-xs"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Draft() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [meta, setMeta] = useState(null);
  const [mode, setMode] = useState("rendered"); // rendered | edit | locked | meta
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [publishMsg, setPublishMsg] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const coverInputRef = useRef(null);

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setMeta((m) => ({ ...m, cover: reader.result }));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/drafts/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        setDoc(data.doc);
        setMeta({ slug, target: "box", ...data.meta });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(String(e.message || e));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/drafts/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc, meta }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setSavedAt(Date.now());
    } catch (e) {
      setLoadError(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }, [slug, doc, meta]);

  // Publish to Supabase (the live feed), uploading screenshots to storage first.
  // Requires being logged in (same as /create). This publishes the DECRYPTED
  // writeup as a normal readable post, so for a box it's the RETIREMENT step.
  const publishPost = useCallback(async () => {
    if (!supabase) return setPublishMsg("No Supabase client configured (set VITE_SUPABASE_* env).");
    if (!user) return setPublishMsg("Log in first (/login) to publish a post.");
    // Guard: never expose a box that is still active.
    if (meta.target === "box" && Date.now() < new Date(meta.active_until).getTime()) {
      const ok = window.confirm(
        "This box is still ACTIVE. Publishing to Supabase exposes the full writeup publicly and defeats the lock. Continue anyway?"
      );
      if (!ok) return;
    }
    setPublishing(true);
    setPublishMsg(null);
    try {
      const hosted = await hostImages(doc);
      let cover = meta.cover || null;
      if (cover && cover.startsWith("data:")) cover = await uploadDataUri(cover, `${slug}-cover`);
      const postSlug = (meta.slug || slug)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const { error } = await supabase
        .from("posts")
        .insert([
          {
            title: meta.title || meta.name,
            sub_title: meta.subtitle || "",
            slug: postSlug,
            content: JSON.stringify(hosted),
            image: cover,
            published: true,
            author_id: user.id,
          },
        ])
        .select();
      if (error) throw error;
      setPublishMsg("Published to the live feed.");
    } catch (e) {
      setPublishMsg(`Publish failed: ${e.message}`);
    } finally {
      setPublishing(false);
    }
  }, [doc, meta, slug, user]);

  if (import.meta.env.PROD) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Draft preview is only available on the local dev server.
      </div>
    );
  }
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading draft...</div>;
  }
  if (loadError && !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 text-center px-6">
        <p className="text-red-500">Could not load draft “{slug}”.</p>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <p className="text-sm text-muted-foreground">
          Run <code>node scripts/import-obsidian.mjs &lt;note.md&gt; --slug {slug}</code> first.
        </p>
      </div>
    );
  }

  const isBox = (meta?.target || "box") === "box";
  const modes = ["rendered", "edit", ...(isBox ? ["locked"] : []), "meta"];

  return (
    // Dev-only review page: scope `dark` to this subtree so the preview matches
    // the published look regardless of the global/system theme. Scoping it here
    // (rather than on <html>) avoids the ThemeProvider effect resetting it.
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-[860px] mx-auto px-6 min-h-14 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md text-sm capitalize cursor-pointer transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {m === "locked" ? "Locked preview" : m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {savedAt && <span className="text-xs text-green-500">Saved</span>}
            {publishMsg && (
              <span className={`text-xs ${publishMsg.startsWith("Published") ? "text-green-500" : "text-red-500"}`}>
                {publishMsg}
              </span>
            )}
            {loadError && <span className="text-xs text-red-500">{loadError}</span>}
            <Button onClick={save} disabled={saving} size="sm" variant="outline">
              {saving ? "Saving..." : "Save draft"}
            </Button>
            <Button onClick={publishPost} disabled={publishing} size="sm">
              {publishing
                ? "Publishing..."
                : isBox
                  ? "Publish to Supabase (retire)"
                  : "Publish to Supabase"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 pt-20 pb-32">
        {mode === "meta" && <MetaPanel meta={meta} setMeta={setMeta} />}

        {mode === "rendered" && (
          <>
            <CoverHeader meta={meta} />
            {renderContent(doc)}
          </>
        )}

        {mode === "edit" && (
          <>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverFile}
            />
            <EditableHeader meta={meta} setMeta={setMeta} coverInputRef={coverInputRef} />
            <WriteupEditor
              key={slug}
              content={doc}
              onUpdate={({ editor }) => setDoc(editor.getJSON())}
            />
          </>
        )}

        {mode === "locked" && isBox && <LockedPreview doc={doc} meta={meta} />}

        {mode === "meta" && (
          <p className="text-sm text-muted-foreground">
            Edit metadata above, then <strong>Save draft</strong>. Switch to Rendered or Locked
            preview to see the result.
          </p>
        )}
      </div>
    </div>
  );
}
