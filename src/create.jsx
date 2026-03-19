import { useState, useRef, useMemo, useEffect } from "react";
import { supabase } from "./database";
import { useAuth } from "./auth-context";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import {
  EditorBubbleMenu,
  EditorFormatBold,
  EditorFormatCode,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorProvider,
} from "@/components/kibo-ui/editor";
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

// Insert image into editor: show data URL instantly, replace with real URL after upload
function insertImageFromFile(file, view) {
  const reader = new FileReader();
  reader.onloadend = async () => {
    const dataUrl = reader.result;
    const { schema } = view.state;
    const imageNode = schema.nodes.image.create({ src: dataUrl, alt: file.name });
    view.dispatch(view.state.tr.replaceSelectionWith(imageNode));

    try {
      const realUrl = await uploadImage(file);
      // Walk the doc to find the data URL node and swap in the real URL
      view.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === dataUrl) {
          view.dispatch(
            view.state.tr.setNodeMarkup(pos, null, { ...node.attrs, src: realUrl })
          );
          return false;
        }
      });
    } catch (e) {
      console.error("Image upload failed:", e);
    }
  };
  reader.readAsDataURL(file);
}

// Tiptap extension: paste or drop images directly into the editor
const ImagePasteExtension = Extension.create({
  name: "imagePaste",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || []);
            const imageFile = items.find(
              (item) => item.type.startsWith("image/") && item.kind === "file"
            );
            if (!imageFile) return false;

            event.preventDefault();
            const file = imageFile.getAsFile();
            if (file) insertImageFromFile(file, view);
            return true;
          },
          handleDrop(view, event) {
            const files = Array.from(event.dataTransfer?.files || []);
            const image = files.find((f) => f.type.startsWith("image/"));
            if (!image) return false;

            event.preventDefault();
            const reader = new FileReader();
            reader.onloadend = async () => {
              const dataUrl = reader.result;
              const { schema } = view.state;
              const imageNode = schema.nodes.image.create({ src: dataUrl, alt: image.name });
              const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (dropPos) {
                view.dispatch(view.state.tr.insert(dropPos.pos, imageNode));
              } else {
                view.dispatch(view.state.tr.replaceSelectionWith(imageNode));
              }

              try {
                const realUrl = await uploadImage(image);
                view.state.doc.descendants((node, pos) => {
                  if (node.type.name === "image" && node.attrs.src === dataUrl) {
                    view.dispatch(
                      view.state.tr.setNodeMarkup(pos, null, { ...node.attrs, src: realUrl })
                    );
                    return false;
                  }
                });
              } catch (e) {
                console.error("Image upload failed:", e);
              }
            };
            reader.readAsDataURL(image);
            return true;
          },
        },
      }),
    ];
  },
});

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

  const extensions = useMemo(() => [ImagePasteExtension], []);

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
        <EditorProvider
          className={[
            "w-full",
            // Remove focus outline
            "[&_.ProseMirror-focused]:outline-none",
            // Paragraphs
            "[&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:leading-relaxed",
            // Headings — match blog view
            "[&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h1]:mb-4",
            "[&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:mb-4",
            "[&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:mb-3",
            // Images
            "[&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:my-6 [&_.ProseMirror_img]:max-w-full",
            // Code blocks
            "[&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:my-4",
            // Blockquotes
            "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-muted-foreground/30 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4",
            // Min height for writing area
            "[&_.ProseMirror]:min-h-[60vh]",
          ].join(" ")}
          content={content}
          onUpdate={handleUpdate}
          extensions={extensions}
          placeholder="Start writing... paste images directly, or type / for commands"
        >
          {/* Minimal bubble menu — just inline formatting, icons only */}
          <EditorBubbleMenu>
            <EditorFormatBold hideName />
            <EditorFormatItalic hideName />
            <EditorFormatUnderline hideName />
            <EditorFormatStrike hideName />
            <EditorFormatCode hideName />
            <EditorLinkSelector />
          </EditorBubbleMenu>
        </EditorProvider>

        <div className="h-[200px]" />
      </div>
    </div>
  );
}

export default Create;
