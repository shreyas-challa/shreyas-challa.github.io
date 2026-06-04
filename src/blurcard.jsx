import { useMemo } from 'react';
import { ProgressiveBlur } from './components/ui/motion-primitives/progressive-blur';
import { EncryptedText } from "@/components/ui/encrypted-text";
import { RippleButton } from './components/ui/ripple-button';
import { Link } from 'react-router-dom';
import { IconLock } from '@tabler/icons-react';

const GIBBERISH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function randStr(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += GIBBERISH[Math.floor(Math.random() * GIBBERISH.length)];
  return s;
}

function extractExcerpt(contentJsonString, maxLength = 160) {
  if (!contentJsonString) return '';
  let text = '';
  try {
    const clean = typeof contentJsonString === 'string' ? contentJsonString.replace(/[\r\n]+/g, ' ') : null;
    const json = clean ? JSON.parse(clean) : contentJsonString;
    const walk = (node) => {
      if (!node || text.length >= maxLength) return;
      if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }
      if (Array.isArray(node.content)) node.content.forEach(walk);
    };
    walk(json);
  } catch (_) {
    return '';
  }
  return text.trim().slice(0, maxLength) + (text.length > maxLength ? '…' : '');
}

function renderContent(jsonString, limitNodes = 6) {
  if (!jsonString) return null;
  let root;
  try {
    const clean = typeof jsonString === 'string' ? jsonString.replace(/[\r\n]+/g, ' ') : null;
    root = clean ? JSON.parse(clean) : jsonString;
  } catch { return null; }
  const nodes = Array.isArray(root.content) ? root.content.slice(0, limitNodes) : [];
  const elements = nodes.map((node, idx) => {
    switch (node.type) {
      case 'paragraph': {
        const text = (node.content || [])
          .filter(c => c.type === 'text' && c.text)
          .map(c => c.text)
          .join(' ');
        if (!text) return <div key={idx} className="h-2" />; // keep spacing for empty paragraphs
        return <p key={idx} className="text-sm leading-relaxed mb-3 text-muted-foreground">{text}</p>;
      }
      case 'image': {
        const { src, alt } = node.attrs || {};
        if (!src) return null;
        return <img key={idx} src={src} alt={alt || ''} className="rounded-md my-4 max-w-full" />;
      }
      case 'codeBlock': {
        const codeText = (node.content || [])
          .filter(c => c.type === 'text' && c.text)
          .map(c => c.text)
          .join('\n');
        return (
          <pre key={idx} className="rounded-md border bg-background p-3 text-xs overflow-auto">
            <code>{codeText}</code>
          </pre>
        );
      }
      default:
        return null;
    }
  });
  return <>{elements}</>;
}

// Featured hero for an ACTIVE box. Same layout as BlurCard, but the body is
// permanent encrypted gibberish and the cover overlay text is frozen (never
// decrypts on refresh). Only the public machine name is shown in the clear.
// "Read more!" goes to /box/:slug, which prompts for the root hash.
export function BoxHero({ box }) {
  const lines = useMemo(() => [86, 78, 72, 64].map(randStr), []);
  const unlockDate = new Date(box.active_until).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className='flex flex-col-reverse md:flex-row w-full max-w-[1200px] mx-auto px-4 md:px-0 gap-6 md:justify-between'>
      <div className='rounded-2xl w-full md:w-[600px] h-auto md:h-[500px] flex flex-col p-4 md:p-8'>
        <h2 className='hidden md:block text-3xl font-bold mb-2'>{box.name}</h2>
        <p className='hidden md:flex items-center gap-1.5 text-sm font-medium mb-4 text-amber-500'>
          <IconLock className='w-4 h-4' /> Encrypted · active box
        </p>
        <div className='relative flex-1 overflow-hidden max-h-[120px] md:max-h-none'>
          <div className='font-mono text-sm leading-relaxed text-muted-foreground/40 blur-[1.5px] select-none'>
            {lines.map((l, i) => <p key={i} className='break-all mb-2'>{l}</p>)}
          </div>
          <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent' />
        </div>
        <div className='mt-4 flex items-center justify-between'>
          <span className='text-xs text-muted-foreground'>Active · unlocks {unlockDate}</span>
          <RippleButton as={Link} to={`/box/${box.slug}`} duration={600} rippleColor="#ADD8E6">Read more!</RippleButton>
        </div>
      </div>
      <div className='relative aspect-square w-full max-w-[450px] mx-auto md:mx-0 overflow-hidden rounded-lg'>
        <img
          src={box.cover || 'https://placehold.co/600x600/png'}
          alt={box.name}
          className='absolute inset-0 object-cover w-full h-full'
        />
        <ProgressiveBlur
          className='pointer-events-none absolute bottom-0 left-0 h-[25%] w-full'
          blurIntensity={6}
        />
        <div className='absolute bottom-0 left-0'>
          <div className='flex flex-col items-start gap-0 px-5 py-4'>
            <p className='text-base font-medium text-white'>{box.name}</p>
            <span className='mb-2 text-base text-zinc-300'>
              <EncryptedText text="writeup encrypted until solved" frozen />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlurCard({ post }) {
  if (!post) {
    return (
      <div className='flex flex-col md:flex-row w-full max-w-[1200px] mx-auto px-4 md:px-0 gap-6 md:justify-between'>
        <div className='rounded-2xl w-full md:w-[600px] h-[300px] md:h-[500px] flex items-center justify-center border text-muted-foreground'>Loading latest post…</div>
        <div className='relative aspect-square w-full max-w-[450px] mx-auto md:mx-0 h-auto md:h-[450px] overflow-hidden rounded-lg bg-muted animate-pulse' />
      </div>
    );
  }

  const cover = post.image || 'https://placehold.co/600x600/png';
  const subtitle = post.sub_title || '';
  const excerpt = subtitle || extractExcerpt(post.content);

  return (
    <div className='flex flex-col-reverse md:flex-row w-full max-w-[1200px] mx-auto px-4 md:px-0 gap-6 md:justify-between'>
      <div className='rounded-2xl w-full md:w-[600px] h-auto md:h-[500px] flex flex-col p-4 md:p-8'>
        <h2 className='hidden md:block text-3xl font-bold mb-2'>{post.title}</h2>
        {subtitle && <p className='hidden md:block text-base font-medium mb-4 text-foreground'>{subtitle}</p>}
        <div className='relative flex-1 overflow-hidden max-h-[120px] md:max-h-none'>
          <div className='hidden md:block'>{renderContent(post.content, 3)}</div>
          <div className='md:hidden'>{renderContent(post.content, 1)}</div>
          <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent' />
        </div>
        <div className='mt-4 flex items-center justify-between'>
          <span className='text-xs text-muted-foreground'>Published {new Date(post.created_at).toLocaleDateString()}</span>
          <RippleButton as={Link} to={`/blog/${post.id}`} duration={600} rippleColor="#ADD8E6">Read more!</RippleButton>
        </div>
      </div>
      <div className='relative aspect-square w-full max-w-[450px] mx-auto md:mx-0 overflow-hidden rounded-lg'>
        <img
          src={cover}
          alt={post.title}
          className='absolute inset-0 object-cover w-full h-full'
        />
        <ProgressiveBlur
          className='pointer-events-none absolute bottom-0 left-0 h-[25%] w-full'
          blurIntensity={6}
        />
        <div className='absolute bottom-0 left-0'>
          <div className='flex flex-col items-start gap-0 px-5 py-4'>
            <p className='text-base font-medium text-white'><EncryptedText text={post.title} revealDelayMs={18}/></p>
            {subtitle && <span className='mb-2 text-base text-zinc-300'><EncryptedText text={subtitle} revealDelayMs={12}/></span>}
          </div>
        </div>
      </div>
    </div>
  );
}