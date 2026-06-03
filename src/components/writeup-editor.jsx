// Shared Tiptap writing surface, styled to match the blog reader view. Used by
// /create (images upload to Supabase) and /draft/:slug (images embed as base64,
// so box writeups stay self-contained for encryption). The image strategy is
// injected via the `uploadImage` prop — omit it to keep pasted images as inline
// base64 data URLs.

import { useMemo } from "react";
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

function readAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// Insert an image: show it instantly as a data URL, then (if an uploader is
// provided) swap in the hosted URL once the upload finishes. With no uploader
// the data URL is the final src.
async function insertImage(file, view, uploadImage, dropPos) {
  const dataUrl = await readAsDataUrl(file);
  const { schema } = view.state;
  const node = schema.nodes.image.create({ src: dataUrl, alt: file.name });
  if (dropPos != null) view.dispatch(view.state.tr.insert(dropPos, node));
  else view.dispatch(view.state.tr.replaceSelectionWith(node));

  if (!uploadImage) return;
  try {
    const realUrl = await uploadImage(file);
    view.state.doc.descendants((n, pos) => {
      if (n.type.name === "image" && n.attrs.src === dataUrl) {
        view.dispatch(view.state.tr.setNodeMarkup(pos, null, { ...n.attrs, src: realUrl }));
        return false;
      }
    });
  } catch (e) {
    console.error("Image upload failed:", e);
  }
}

function makeImagePasteExtension(uploadImage) {
  return Extension.create({
    name: "imagePaste",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handlePaste(view, event) {
              const items = Array.from(event.clipboardData?.items || []);
              const imageItem = items.find(
                (item) => item.type.startsWith("image/") && item.kind === "file"
              );
              if (!imageItem) return false;
              event.preventDefault();
              const file = imageItem.getAsFile();
              if (file) insertImage(file, view, uploadImage);
              return true;
            },
            handleDrop(view, event) {
              const files = Array.from(event.dataTransfer?.files || []);
              const image = files.find((f) => f.type.startsWith("image/"));
              if (!image) return false;
              event.preventDefault();
              const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
              insertImage(image, view, uploadImage, at?.pos);
              return true;
            },
          },
        }),
      ];
    },
  });
}

const EDITOR_CLASSES = [
  "w-full",
  "[&_.ProseMirror-focused]:outline-none",
  "[&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p]:leading-relaxed",
  "[&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h1]:mb-4",
  "[&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:mb-4",
  "[&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:mb-3",
  "[&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:my-6 [&_.ProseMirror_img]:max-w-full",
  "[&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:my-4",
  "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-muted-foreground/30 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4",
  "[&_.ProseMirror]:min-h-[60vh]",
].join(" ");

export function WriteupEditor({ content, onUpdate, uploadImage, placeholder }) {
  const extensions = useMemo(() => [makeImagePasteExtension(uploadImage)], [uploadImage]);

  return (
    <EditorProvider
      className={EDITOR_CLASSES}
      content={content}
      onUpdate={onUpdate}
      extensions={extensions}
      placeholder={placeholder || "Start writing... paste images directly, or type / for commands"}
    >
      <EditorBubbleMenu>
        <EditorFormatBold hideName />
        <EditorFormatItalic hideName />
        <EditorFormatUnderline hideName />
        <EditorFormatStrike hideName />
        <EditorFormatCode hideName />
        <EditorLinkSelector />
      </EditorBubbleMenu>
    </EditorProvider>
  );
}
