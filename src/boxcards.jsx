import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IconLock, IconLockOpen } from "@tabler/icons-react";

const GIBBERISH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function randStr(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += GIBBERISH[Math.floor(Math.random() * GIBBERISH.length)];
  return s;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// A single box card, sized to sit inside the normal blog-post grid. Active boxes
// show ONLY public metadata (name + icon) over an encrypted-looking body, so the
// writeup is visible-but-unreadable until solved. No subtitle or content is
// rendered while locked. Clicking goes to /box/:slug, which asks for the root
// hash. Retired boxes link straight to the open writeup.
export function BoxCard({ box }) {
  const navigate = useNavigate();
  const lines = useMemo(() => [68, 72, 54, 70, 33].map(randStr), []);

  return (
    <div
      onClick={() => navigate(`/box/${box.slug}`)}
      className="cursor-pointer group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border">
        {box.cover ? (
          <img src={box.cover} alt={box.name} className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center">
            <IconLock className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{box.name}</h3>
          <div className="flex items-center gap-1.5 text-xs">
            {box.locked ? (
              <>
                <IconLock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-500">Encrypted</span>
              </>
            ) : (
              <>
                <IconLockOpen className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">Writeup unlocked</span>
              </>
            )}
          </div>
        </div>
      </div>

      {box.locked ? (
        <div className="p-4">
          <div className="select-none text-muted-foreground/30 font-mono text-[11px] leading-relaxed blur-[1.5px]">
            {lines.map((l, i) => (
              <p key={i} className="break-all mb-1">{l}</p>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Active box. Unlocks on <span className="text-foreground font-medium">{formatDate(box.active_until)}</span>,
            or enter the root hash to read it now.
          </p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Box retired. Click to read the full writeup.</p>
        </div>
      )}
    </div>
  );
}

