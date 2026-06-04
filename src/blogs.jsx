import { Link } from 'react-router-dom'
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll'
import { MinimalCard, MinimalCardImage, MinimalCardTitle, MinimalCardDescription } from '@/components/ui/minimal-card'
import { EncryptedText } from '@/components/ui/encrypted-text'
import { IconLock } from '@tabler/icons-react'

// A still-active box rendered as a grid card. The machine name shows in the
// clear, but the writeup stays encrypted: the cover is blurred and the
// description is frozen gibberish (never decrypts on refresh). Clicking goes to
// /box/:slug, which prompts for the root hash.
function EncryptedBoxCard({ box }) {
  const unlockDate = new Date(box.active_until).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return (
    <Link to={`/box/${box.slug}`} className="block cursor-pointer h-full">
      <MinimalCard className="flex h-full flex-col">
        <div className="relative">
          <MinimalCardImage src={box.cover || 'https://placehold.co/600x600/png'} alt={box.name} className="[&_img]:blur-[2px]" />
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
            <IconLock className="h-3.5 w-3.5" /> Encrypted
          </span>
        </div>
        <MinimalCardTitle className="line-clamp-2">{box.name}</MinimalCardTitle>
        <MinimalCardDescription className="font-mono">
          <EncryptedText text="writeup encrypted until solved" frozen />
          <span className="mt-1 block text-xs text-muted-foreground">Active box · unlocks {unlockDate}</span>
        </MinimalCardDescription>
      </MinimalCard>
    </Link>
  );
}

function extractExcerpt(contentJsonString, maxLength = 120) {
  if (!contentJsonString) return '';
  let text = '';
  try {
    const clean = typeof contentJsonString === 'string' ? contentJsonString.replace(/[\r\n]+/g, ' ') : null;
    const json = clean ? JSON.parse(clean) : contentJsonString;
    const walk = (n) => {
      if (!n || text.length >= maxLength) return;
      if (n.type === 'text' && n.text) text += n.text + ' ';
      if (Array.isArray(n.content)) n.content.forEach(walk);
    };
    walk(json);
  } catch (_) { return ''; }
  return text.trim().slice(0, maxLength) + (text.length > maxLength ? '…' : '');
}

function Blogs({ posts, boxes = [], heading = "Other Blog Posts" }) {
  const list = posts || [];
  const boxList = boxes || [];
  return (
    <div>
      <RevealOnScroll delay={100} duration={700}>
        <h2 className='text-3xl font-bold mb-8 text-foreground'>{heading}</h2>
      </RevealOnScroll>
      {list.length === 0 && boxList.length === 0 && (
        <div className='text-muted-foreground'>No posts yet.</div>
      )}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
        {boxList.map((box, i) => (
          <RevealOnScroll key={`box-${box.slug}`} delay={150 + i*75} duration={700} className="h-full">
            <EncryptedBoxCard box={box} />
          </RevealOnScroll>
        ))}
        {list.map((post, i) => (
          <RevealOnScroll key={post.id} delay={150 + (boxList.length + i)*75} duration={700} className="h-full">
            <Link to={`/blog/${post.id}`} className="block cursor-pointer h-full">
              <MinimalCard className="flex h-full flex-col">
                <MinimalCardImage
                  src={post.image || '/images/welcome-blog.jpg'}
                  alt={post.title}
                />
                <MinimalCardTitle className="line-clamp-2">{post.title}</MinimalCardTitle>
                <MinimalCardDescription className="line-clamp-3">
                  {post.sub_title || extractExcerpt(post.content)}
                </MinimalCardDescription>
              </MinimalCard>
            </Link>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
}

export { Blogs };
