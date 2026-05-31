import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FloatingDock } from "./components/ui/floating-dock";
import { links, createLink } from "./links";
import { supabase } from "./database";
import { useAuth } from "./auth-context";
import { renderContent } from "./render-content";

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
      <div className="md:fixed md:z-50 md:bottom-2 md:left-1/2 md:-translate-x-1/2">
        <FloatingDock items={dockLinks} />
      </div>
    </div>
  );
}
