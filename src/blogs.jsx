import { RevealOnScroll } from '@/components/ui/reveal-on-scroll'
import { MinimalCard, MinimalCardImage, MinimalCardTitle, MinimalCardDescription } from '@/components/ui/minimal-card'

function extractExcerpt(contentJsonString, maxLength = 120) {
  if (!contentJsonString) return '';
  let text = '';
  try {
    const json = typeof contentJsonString === 'string' ? JSON.parse(contentJsonString) : contentJsonString;
    const walk = (n) => {
      if (!n || text.length >= maxLength) return;
      if (n.type === 'text' && n.text) text += n.text + ' ';
      if (Array.isArray(n.content)) n.content.forEach(walk);
    };
    walk(json);
  } catch (_) { return ''; }
  return text.trim().slice(0, maxLength) + (text.length > maxLength ? '…' : '');
}

function Blogs({ posts }) {
  const list = posts || [];
  return (
    <div>
      <RevealOnScroll delay={100} duration={700}>
        <h2 className='text-3xl font-bold mb-8 text-foreground'>Other Blog Posts</h2>
      </RevealOnScroll>
      {list.length === 0 && (
        <div className='text-muted-foreground'>No posts yet.</div>
      )}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {list.map((post, i) => (
          <RevealOnScroll key={post.id} delay={150 + i*75} duration={700}>
            <MinimalCard>
              <MinimalCardImage
                src={post.image || 'https://placehold.co/600x400/png'}
                alt={post.title}
              />
              <MinimalCardTitle>{post.title}</MinimalCardTitle>
              <MinimalCardDescription>
                {post['sub-title'] || extractExcerpt(post.content)}
              </MinimalCardDescription>
            </MinimalCard>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
}

export { Blogs };