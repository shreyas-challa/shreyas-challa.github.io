// Renders a TipTap doc (JSON string or object) to React nodes.
// Shared by blog.jsx and box.jsx so locked and normal writeups render identically.
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
        const text = (node.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
        const level = node.attrs?.level || 2;
        if (level === 1) return <h1 key={idx} className="font-bold text-3xl mt-8 mb-4">{text}</h1>;
        if (level === 2) return <h2 key={idx} className="font-bold text-2xl mt-8 mb-4">{text}</h2>;
        return <h3 key={idx} className="font-bold text-xl mt-6 mb-3">{text}</h3>;
      }
      case 'paragraph': {
        const text = (node.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
        if (!text) return <div key={idx} className="h-4" />;
        return <p key={idx} className="mb-4 leading-relaxed">{text}</p>;
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
