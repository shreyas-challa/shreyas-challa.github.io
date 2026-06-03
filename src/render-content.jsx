// Renders a TipTap doc (JSON string or object) to React nodes.
// Shared by blog.jsx and box.jsx so locked and normal writeups render identically.

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
      case 'link':
        el = (
          <a href={mark.attrs?.href} target="_blank" rel="noreferrer" className="text-blue-500 underline">
            {el}
          </a>
        );
        break;
      default: break;
    }
  }
  return <span key={key}>{el}</span>;
}

function renderInline(content) {
  return (content || []).filter((c) => c.type === 'text').map((c, i) => renderText(c, i));
}

export function renderContent(jsonString) {
  if (!jsonString) return null;
  let root;
  try {
    const clean = typeof jsonString === 'string' ? jsonString.replace(/[\r\n]+/g, ' ') : null;
    root = clean ? JSON.parse(clean) : jsonString;
  } catch { return null; }
  const nodes = Array.isArray(root.content) ? root.content : [];
  return nodes.map((node, idx) => {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 2;
        const inner = renderInline(node.content);
        if (level === 1) return <h1 key={idx} className="font-bold text-3xl mt-8 mb-4">{inner}</h1>;
        if (level === 2) return <h2 key={idx} className="font-bold text-2xl mt-8 mb-4">{inner}</h2>;
        return <h3 key={idx} className="font-bold text-xl mt-6 mb-3">{inner}</h3>;
      }
      case 'paragraph': {
        const hasText = (node.content || []).some((c) => c.type === 'text' && c.text);
        if (!hasText) return <div key={idx} className="h-4" />;
        return <p key={idx} className="mb-4 leading-relaxed">{renderInline(node.content)}</p>;
      }
      case 'image': {
        const { src, alt } = node.attrs || {};
        if (!src) return null;
        return <img key={idx} src={src} alt={alt || ''} className="rounded-md my-6 max-w-full" />;
      }
      case 'codeBlock': {
        const codeText = (node.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
        return (
          <pre key={idx} className="rounded-md border bg-muted p-4 text-sm overflow-auto my-4">
            <code>{codeText}</code>
          </pre>
        );
      }
      default:
        return null;
    }
  });
}
