import { useState, useRef } from "react";
import { supabase } from "./database";
import {
  EditorBubbleMenu,
  EditorCharacterCount,
  EditorClearFormatting,
  EditorFloatingMenu,
  EditorFormatBold,
  EditorFormatCode,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatSubscript,
  EditorFormatSuperscript,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorNodeBulletList,
  EditorNodeCode,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTable,
  EditorNodeTaskList,
  EditorNodeText,
  EditorProvider,
  EditorSelector,
  EditorTableColumnAfter,
  EditorTableColumnBefore,
  EditorTableColumnDelete,
  EditorTableColumnMenu,
  EditorTableDelete,
  EditorTableFix,
  EditorTableGlobalMenu,
  EditorTableHeaderColumnToggle,
  EditorTableHeaderRowToggle,
  EditorTableMenu,
  EditorTableMergeCells,
  EditorTableRowAfter,
  EditorTableRowBefore,
  EditorTableRowDelete,
  EditorTableRowMenu,
  EditorTableSplitCell,
} from "@/components/kibo-ui/editor";
import { Button } from "@/components/ui/button";
import { ImageIcon, SaveIcon, EyeIcon, Trash2Icon } from "lucide-react";

function Create() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "" }],
      },
    ],
  });
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const fileInputRef = useRef(null);
  const inlineImageInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null);

  const handleUpdate = ({ editor }) => {
    const json = editor.getJSON();
    setContent(json);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertInlineImage = async (file) => {
    if (!file) return;
    try {
      // Upload inline image to Supabase storage bucket
      const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
      const { error: uploadError } = await supabase.storage
        .from("post-content-images")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage
        .from("post-content-images")
        .getPublicUrl(fileName);
      const url = publicData.publicUrl;
      if (editor) {
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      } else {
        alert(`Image uploaded. Use /image and paste URL: ${url}`);
      }
    } catch (e) {
      console.error("Inline image upload failed", e);
      alert("Inline image upload failed");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let coverUrl = null;
      if (coverFile) {
        const fileName = `${Date.now()}-${coverFile.name}`.replace(/\s+/g, "-");
        const { error: uploadError } = await supabase.storage
          .from("post-covers")
          .upload(fileName, coverFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage
          .from("post-covers")
          .getPublicUrl(fileName);
        coverUrl = publicData.publicUrl;
      }

      const insertPayload = {
        title,
        "sub-title": subtitle, // your table uses "sub-title" column
        content: JSON.stringify(content), // store as JSON string
        image: coverUrl,
      };
      const { data, error: insertError } = await supabase.from("posts").insert([insertPayload]).select();
      if (insertError) throw insertError;
      console.log("Post saved successfully:", data);
      alert("Post saved successfully!");
      // Clear form after successful save
      setTitle("");
      setSubtitle("");
      setContent({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] });
      setCoverPreview(null);
      setCoverFile(null);
    } catch (e) {
      console.error("Save failed", e);
      setError(e.message);
      alert("Save failed. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    alert("Preview feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create Blog Post</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePreview}>
              <EyeIcon className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave}>
              <SaveIcon className="w-4 h-4 mr-2" />
              Save Post
            </Button>
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Cover Image</label>
          {coverPreview ? (
            <div className="relative rounded-lg overflow-hidden border">
              <img
                src={coverPreview}
                alt="Cover"
                className="w-full h-64 object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-3 right-3"
                onClick={() => { setCoverPreview(null); setCoverFile(null); }}
              >
                <Trash2Icon className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload cover image
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Title Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your blog post title..."
            className="w-full px-4 py-3 text-2xl font-bold border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Subtitle Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Subtitle</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A short subtitle or description"
            className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Editor Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Content</label>
          <div className="border rounded-lg overflow-hidden">
            <EditorProvider
              className="min-h-[500px] w-full overflow-y-auto bg-background p-6"
              content={content}
              onUpdate={handleUpdate}
              onCreate={({ editor }) => {
                setEditor(editor);
                // expose a helper for slash command to open file picker
                window.__openInlineImagePicker = () => inlineImageInputRef.current?.click();
              }}
              placeholder="Start writing your blog post... Use '/' for commands"
            >
              <EditorFloatingMenu>
                <EditorNodeHeading1 hideName />
                <EditorNodeHeading2 hideName />
                <EditorNodeHeading3 hideName />
                <EditorNodeBulletList hideName />
                <EditorNodeQuote hideName />
                <EditorNodeCode hideName />
                <EditorNodeTable hideName />
              </EditorFloatingMenu>
              <EditorBubbleMenu>
                <EditorSelector title="Text">
                  <EditorNodeText />
                  <EditorNodeHeading1 />
                  <EditorNodeHeading2 />
                  <EditorNodeHeading3 />
                  <EditorNodeBulletList />
                  <EditorNodeOrderedList />
                  <EditorNodeTaskList />
                  <EditorNodeQuote />
                  <EditorNodeCode />
                </EditorSelector>
                <EditorSelector title="Format">
                  <EditorFormatBold />
                  <EditorFormatItalic />
                  <EditorFormatUnderline />
                  <EditorFormatStrike />
                  <EditorFormatCode />
                  <EditorFormatSuperscript />
                  <EditorFormatSubscript />
                </EditorSelector>
                <EditorLinkSelector />
                <EditorClearFormatting />
              </EditorBubbleMenu>
              <EditorTableMenu>
                <EditorTableColumnMenu>
                  <EditorTableColumnBefore />
                  <EditorTableColumnAfter />
                  <EditorTableColumnDelete />
                </EditorTableColumnMenu>
                <EditorTableRowMenu>
                  <EditorTableRowBefore />
                  <EditorTableRowAfter />
                  <EditorTableRowDelete />
                </EditorTableRowMenu>
                <EditorTableGlobalMenu>
                  <EditorTableHeaderColumnToggle />
                  <EditorTableHeaderRowToggle />
                  <EditorTableDelete />
                  <EditorTableMergeCells />
                  <EditorTableSplitCell />
                  <EditorTableFix />
                </EditorTableGlobalMenu>
              </EditorTableMenu>
              <div className="mt-4 pt-4 border-t text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                <EditorCharacterCount.Words>Words: </EditorCharacterCount.Words>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inlineImageInputRef.current?.click()}
                >
                  Add Inline Image
                </Button>
                <input
                  ref={inlineImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) insertInlineImage(f);
                  }}
                />
                {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
                {error && <span className="text-xs text-red-600">{error}</span>}
              </div>
            </EditorProvider>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-sm">Editor Tips:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Type <code className="bg-background px-1 rounded">/</code> to see available commands</li>
            <li>Select text to see formatting options</li>
            <li>Use <code className="bg-background px-1 rounded">```</code> for code blocks with syntax highlighting</li>
            <li>Drag and drop to reorder list items</li>
            <li>Use markdown shortcuts like <code className="bg-background px-1 rounded">**bold**</code> or <code className="bg-background px-1 rounded">*italic*</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Create;
