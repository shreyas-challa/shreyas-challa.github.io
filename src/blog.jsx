import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FloatingDock } from "./components/ui/floating-dock";
import { links, createLink } from "./links";
import { supabase } from "./database";
import { useAuth } from "./auth-context";

function renderContent(jsonString) {
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

export default function Blog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [id]);

  const dockLinks = user ? [...links.slice(0, -1), createLink, links[links.length - 1]] : links;

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
        <div className="fixed items-center z-50 bottom-2 md:left-1/2 md:-translate-x-1/2">
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
        <h1 className="text-4xl font-bold mb-2 text-center">{post.title}</h1>
        {subtitle && <p className="text-lg text-muted-foreground mb-2 text-center">{subtitle}</p>}
        <span className="text-xs text-muted-foreground mb-8">
          {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <div className="w-full">
          {renderContent(post.content)}
        </div>
        <div className="h-[100px]"></div>
      </div>
      <div className="fixed items-center z-50 bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  );
}
