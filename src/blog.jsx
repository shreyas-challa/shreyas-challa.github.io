import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FloatingDock } from "./components/ui/floating-dock";
import { links, createLink } from "./links";
import { supabase } from "./database";
import { useAuth } from "./auth-context";
import { renderContent } from "./render-content";
import { WriteupEditor } from "./components/writeup-editor";
import { Loader2Icon, SaveIcon } from "lucide-react";

// Upload a pasted/dropped image to Supabase and return its public URL. Mirrors
// the uploader in create.jsx so edited posts host images the same way.
async function uploadImage(file) {
  const fileName = `content/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

// Parse stored TipTap content (a JSON string) into the object shape the editor
// expects. Falls back to an empty doc if the content is missing or malformed.
function parseDoc(content) {
  const empty = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] };
  if (!content) return empty;
  if (typeof content === "object") return content;
  // Try a faithful parse first so well-formed docs round-trip untouched. Some
  // older rows hold raw line breaks that break JSON.parse; the reader strips
  // those before parsing, so fall back to the same cleaning rather than wiping
  // the body to a blank canvas.
  try {
    return JSON.parse(content);
  } catch {
    try {
      return JSON.parse(content.replace(/[\r\n]+/g, " "));
    } catch {
      return empty;
    }
  }
}

export default function Blog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Owner edit mode. Seeded from the loaded post; saving issues an UPDATE so the
  // row's id and created_at are untouched (order on the home page is preserved).
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eSubtitle, setESubtitle] = useState("");
  const [eContent, setEContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    // URLs are slug-based (e.g. /blog/about-me); old numeric /blog/6 links still
    // resolve by falling back to the id column when the param is all digits.
    const column = /^\d+$/.test(slug) ? 'id' : 'slug';
    supabase
      .from('posts')
      .select('*')
      .eq(column, slug)
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [slug]);

  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links;

  function startEdit() {
    setETitle(post.title || "");
    setESubtitle(post.sub_title || "");
    setEContent(parseDoc(post.content));
    setSaveError(null);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!supabase || !post) return;
    if (!eTitle.trim()) { setSaveError("Title is required"); return; }
    setSaving(true);
    setSaveError(null);
    // UPDATE (not insert) keeps the same row, so created_at and the home-page
    // ordering stay exactly as they are.
    const { data, error } = await supabase
      .from('posts')
      .update({
        title: eTitle,
        sub_title: eSubtitle,
        content: JSON.stringify(eContent),
      })
      .eq('id', post.id)
      .select();
    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }
    if (!data || data.length === 0) {
      setSaveError('Nothing was updated. The database is blocking this update (no RLS update policy). Add an update policy in Supabase.');
      setSaving(false);
      return;
    }
    setPost(data[0]);
    setSaving(false);
    setEditing(false);
  }

  async function handleDelete() {
    if (!supabase || !post) return;
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    const { data, error } = await supabase.from('posts').delete().eq('id', post.id).select();
    if (error) {
      window.alert(`Delete failed: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      window.alert('Nothing was deleted. The database is blocking this delete (no RLS delete policy). Add a delete policy in Supabase, or remove the row from the dashboard.');
      return;
    }
    navigate('/');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <button onClick={() => navigate("/")} className="text-blue-500 underline">Go home</button>
        <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
          <FloatingDock items={dockLinks} />
        </div>
      </div>
    );
  }

  const cover = post.image || '/images/welcome-blog.jpg';
  const subtitle = post.sub_title || '';

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <div className="w-[200px] h-[200px] rounded-xl mt-10">
        <img className="rounded-xl object-cover w-full h-full" src={cover} alt={post.title} />
      </div>
      <div className="flex flex-col justify-center items-center w-full max-w-[800px] px-6 mt-8">
        {editing ? (
          <input
            type="text"
            value={eTitle}
            onChange={(e) => setETitle(e.target.value)}
            placeholder="Title"
            className="w-full text-4xl font-bold text-center mb-2 bg-transparent border-none outline-none placeholder:text-muted-foreground/25"
          />
        ) : (
          <h1 className="text-4xl font-bold mb-2 text-center">{post.title}</h1>
        )}
        {editing ? (
          <input
            type="text"
            value={eSubtitle}
            onChange={(e) => setESubtitle(e.target.value)}
            placeholder="Add a subtitle..."
            className="w-full text-lg text-muted-foreground text-center mb-2 bg-transparent border-none outline-none placeholder:text-muted-foreground/25"
          />
        ) : (
          subtitle && <p className="text-lg text-muted-foreground mb-2 text-center">{subtitle}</p>
        )}
        <span className="text-xs text-muted-foreground mb-8">
          {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        {user && (
          <div className="mb-8 flex items-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-500 border border-green-500/40 rounded-md px-3 py-1.5 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="text-xs font-medium text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {saveError && <span className="text-xs text-red-500">{saveError}</span>}
              </>
            ) : (
              <>
                <button
                  onClick={startEdit}
                  className="text-xs font-medium text-blue-500 border border-blue-500/40 rounded-md px-3 py-1.5 hover:bg-blue-500/10 transition-colors"
                >
                  Edit post
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs font-medium text-red-500 border border-red-500/40 rounded-md px-3 py-1.5 hover:bg-red-500/10 transition-colors"
                >
                  Delete post
                </button>
              </>
            )}
          </div>
        )}
        <div className="w-full">
          {editing
            ? <WriteupEditor content={eContent} onUpdate={({ editor }) => setEContent(editor.getJSON())} uploadImage={uploadImage} />
            : renderContent(post.content)}
        </div>
        <div className="h-[100px]"></div>
      </div>
      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  );
}
