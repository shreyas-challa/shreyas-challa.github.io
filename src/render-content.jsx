// Renders a TipTap doc (JSON string or object) to React nodes.
// Shared by blog.jsx and box.jsx so locked and normal writeups render identically.

// Only allow safe link schemes. Blocks javascript:/data:/vbscript: hrefs that
// would otherwise turn stored post content into an XSS vector. Returns undefined
// for anything that is not http(s), mailto, a relative path, or an anchor.
function safeHref(href) {
  if (typeof href !== 'string') return undefined;
  const v = href.trim();
  if (v.startsWith('/') || v.startsWith('#') || v.startsWith('./') || v.startsWith('../')) return v;
  if (/^(https?:|mailto:)/i.test(v)) return v;
  return undefined;
}

// Render a single text node honoring its inline marks (code, bold, italic,
// underline, strike, link). Without this, marks applied in the editor — most
// notably inline `code` — flatten to plain text in the rendered view.
function renderText(node, key) {
  let el = node.text;
  for (const mark of node.marks || []) {
    switch (mark.type) {
      case 'bold': el = <strong>{el}</strong>; break;
      case 'italic': el = <em>{el}</em>; break;
      case 'underline': el = <u>{el}</u>; break;
      case 'strike': el = <s>{el}</s>; break;
      case 'code':
        el = <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{el}</code>;
        break;
      case 'link': {
        const href = safeHref(mark.attrs?.href);
        el = href
          ? <a href={href} target="_blank" rel="noreferrer noopener" className="text-blue-500 underline">{el}</a>
          : <span className="text-blue-500 underline">{el}</span>;
        break;
      }
      default: break;
    }
  }
  return <span key={key}>{el}</span>;
}

function renderInline(content) {
  return (content || []).filter((c) => c.type === 'text').map((c, i) => renderText(c, i));
}

// Render a single block node. Recursive so list items (which wrap paragraphs
// and can nest further lists) render through the same path as top-level blocks.
function renderNode(node, key) {
  switch (node.type) {
    case 'heading': {
      const level = node.attrs?.level || 2;
      const inner = renderInline(node.content);
      if (level === 1) return <h1 key={key} className="font-bold text-3xl mt-8 mb-4">{inner}</h1>;
      if (level === 2) return <h2 key={key} className="font-bold text-2xl mt-8 mb-4">{inner}</h2>;
      return <h3 key={key} className="font-bold text-xl mt-6 mb-3">{inner}</h3>;
    }
    case 'paragraph': {
      const hasText = (node.content || []).some((c) => c.type === 'text' && c.text);
      if (!hasText) return <div key={key} className="h-4" />;
      return <p key={key} className="mb-4 leading-relaxed">{renderInline(node.content)}</p>;
    }
    case 'image': {
      const { src, alt } = node.attrs || {};
      if (!src) return null;
      return <img key={key} src={src} alt={alt || ''} className="rounded-md my-6 max-w-full" />;
    }
    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6 mb-4 space-y-1 leading-relaxed">
          {(node.content || []).map((c, i) => renderNode(c, i))}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6 mb-4 space-y-1 leading-relaxed">
          {(node.content || []).map((c, i) => renderNode(c, i))}
        </ol>
      );
    case 'listItem':
      return (
        <li key={key}>
          {(node.content || []).map((c, i) =>
            // Tiptap wraps each item's text in a paragraph; render it inline so
            // list rows stay tight instead of inheriting paragraph margins.
            c.type === 'paragraph' ? <span key={i}>{renderInline(c.content)}</span> : renderNode(c, i)
          )}
        </li>
      );
    case 'blockquote': {
      const children = Array.isArray(node.content) ? node.content : [];
      // Attribution convention: if the quote's last line starts with a
      // hyphen marker ("- Name"), pull it out as the author shown bottom-
      // right. Everything above it is the quote body. No marker => no author.
      let bodyNodes = children;
      let author = null;
      const last = children[children.length - 1];
      if (last && last.type === 'paragraph') {
        const text = (last.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
        const m = text.match(/^\s*[-–—]\s+(.+)$/);
        if (m && m[1].trim()) {
          author = m[1].trim();
          bodyNodes = children.slice(0, -1);
        }
      }
      return (
        <figure key={key} className="my-6 rounded-lg border border-border bg-muted/50 px-5 py-4">
          <blockquote className="italic leading-relaxed text-foreground/90">
            {bodyNodes.map((c, i) => {
              if (c.type !== 'paragraph') return null;
              const hasText = (c.content || []).some((t) => t.type === 'text' && t.text);
              if (!hasText) return <div key={i} className="h-2" />;
              return <p key={i} className="mb-2 last:mb-0">{renderInline(c.content)}</p>;
            })}
          </blockquote>
          {author && (
            <figcaption className="mt-3 text-right text-sm font-medium not-italic text-muted-foreground">
              {author}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'codeBlock': {
      const codeText = (node.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
      return (
        <pre key={key} className="rounded-md border bg-muted p-4 text-sm overflow-auto my-4">
          <code>{codeText}</code>
        </pre>
      );
    }
    default:
      return null;
  }
}

export function renderContent(jsonString) {
  if (!jsonString) return null;
  let root;
  try {
    const clean = typeof jsonString === 'string' ? jsonString.replace(/[\r\n]+/g, ' ') : null;
    root = clean ? JSON.parse(clean) : jsonString;
  } catch { return null; }
  const nodes = Array.isArray(root.content) ? root.content : [];
  return nodes.map((node, idx) => renderNode(node, idx));
}
