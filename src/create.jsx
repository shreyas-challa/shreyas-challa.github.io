import { useState, useRef, useEffect } from "react";
import { supabase } from "./database";
import { useAuth } from "./auth-context";
import { WriteupEditor } from "./components/writeup-editor";
import { ImageIcon, SaveIcon, Loader2Icon, XIcon, CheckIcon } from "lucide-react";

// Upload an image file to Supabase and return the public URL
async function uploadImage(file) {
  const fileName = `content/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
}

function Create() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
  });
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleUpdate = ({ editor }) => {
    setContent(editor.getJSON());
  };

  const handleCoverUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      let coverUrl = null;
      if (coverFile) {
        const fileName = `covers/${Date.now()}-${coverFile.name.replace(/\s+/g, "-")}`;
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(fileName, coverFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
        coverUrl = data.publicUrl;
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const { error: insertError } = await supabase
        .from("posts")
        .insert([
          {
            title,
            sub_title: subtitle,
            slug,
            content: JSON.stringify(content),
            image: coverUrl,
            published: true,
            author_id: user.id,
          },
        ])
        .select();
      if (insertError) throw insertError;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Save failed", e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Ctrl+S / Cmd+S to save
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-[800px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {saving && (
              <>
                <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saved && (
              <>
                <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">Published!</span>
              </>
            )}
            {error && <span className="text-red-500">{error}</span>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* Writing area — mirrors the blog view layout */}
      <div className="max-w-[800px] mx-auto px-6 pt-20">
        {/* Cover image */}
        <div className="flex justify-center mt-10">
          {coverPreview ? (
            <div className="relative group">
              <img
                src={coverPreview}
                alt="Cover"
                className="w-[200px] h-[200px] rounded-xl object-cover"
              />
              <button
                onClick={() => {
                  setCoverPreview(null);
                  setCoverFile(null);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-[200px] h-[200px] rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 hover:text-muted-foreground/70 hover:border-muted-foreground/40 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">Add cover</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Title — matches blog view: text-4xl font-bold text-center */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full text-4xl font-bold text-center mt-8 mb-2 bg-transparent border-none outline-none placeholder:text-muted-foreground/25"
        />

        {/* Subtitle — matches blog view: text-lg text-muted-foreground text-center */}
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Add a subtitle..."
          className="w-full text-lg text-muted-foreground text-center mb-8 bg-transparent border-none outline-none placeholder:text-muted-foreground/25"
        />

        {/* Content editor — styled to match blog view rendering */}
        <WriteupEditor content={content} onUpdate={handleUpdate} uploadImage={uploadImage} />

        <div className="h-[200px]" />
      </div>
    </div>
  );
}

export default Create;
