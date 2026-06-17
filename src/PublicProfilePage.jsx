import { useState, useRef } from "react";

// ─── Design Tokens ────────────────────────────────────────────────
// Palette: deep slate bg, warm sand card, coral accent, sage green, soft gold
const T = {
  bg: "#0f1117",
  card: "#1a1d27",
  cardBorder: "#252836",
  coral: "#ff6b6b",
  coralDim: "#ff6b6b22",
  sage: "#6bcb8b",
  gold: "#f7c948",
  sand: "#f0e6d3",
  muted: "#6b7280",
  mutedLight: "#9ca3af",
  text: "#f0e6d3",
  textDim: "#a89f94",
};

// ─── Sample Data ───────────────────────────────────────────────────
const SAMPLE_POSTS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=700&q=80",
    caption: "Desert at dusk — nothing compares 🌄 #landscape #travel",
    likes: 284,
    liked: false,
    comments: [
      { id: 1, user: "mira_shots", text: "The colours are unreal 😭", avatar: "M" },
      { id: 2, user: "dev.nomad", text: "Which desert is this?", avatar: "D" },
    ],
    timestamp: "3h ago",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&q=80",
    caption: "Late-night cook session 🍳 New recipe dropped on the blog",
    likes: 117,
    liked: true,
    comments: [
      { id: 1, user: "foodie.log", text: "Looks incredible, need the recipe!", avatar: "F" },
    ],
    timestamp: "1d ago",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=700&q=80",
    caption: "Sunday mornings hit different ☕",
    likes: 196,
    liked: false,
    comments: [],
    timestamp: "2d ago",
  },
];

// ─── Micro Icons ──────────────────────────────────────────────────
const Icon = {
  Heart: ({ filled, size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? T.coral : "none"} stroke={filled ? T.coral : T.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Comment: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Share: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Dots: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={T.mutedLight}>
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.coral} strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  Grid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  Feed: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="5" rx="1" /><rect x="3" y="10" width="18" height="5" rx="1" /><rect x="3" y="17" width="18" height="4" rx="1" />
    </svg>
  ),
};

// ─── Avatar ───────────────────────────────────────────────────────
const AVATAR_COLORS = ["#ff6b6b", "#6bcb8b", "#f7c948", "#7c9ef5", "#d48aff"];
function Avatar({ name, size = 36, ring = false }) {
  const bg = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {ring && (
        <div style={{
          position: "absolute", inset: -3, borderRadius: "50%",
          background: "conic-gradient(#ff6b6b, #f7c948, #6bcb8b, #7c9ef5, #ff6b6b)",
          zIndex: 0,
        }} />
      )}
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#0f1117", fontWeight: 800, fontSize: size * 0.38,
        position: "relative", zIndex: 1,
        border: ring ? `3px solid ${T.card}` : "none",
      }}>
        {name[0].toUpperCase()}
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ msg }) {
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: T.sand, color: T.bg, padding: "10px 22px", borderRadius: 40,
      fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 4px 24px #0006",
      whiteSpace: "nowrap",
    }}>{msg}</div>
  );
}

// ─── Share Sheet ─────────────────────────────────────────────────
function ShareSheet({ post, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = `https://tezconnect.app/post/${post.id}`;
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const options = [["💬", "Message"], ["📲", "WhatsApp"], ["🔗", copied ? "Copied!" : "Copy link"], ["✉️", "Email"]];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, padding: "20px 20px 40px", border: `1px solid ${T.cardBorder}` }}>
        <div style={{ width: 36, height: 4, background: T.cardBorder, borderRadius: 2, margin: "0 auto 22px" }} />
        <p style={{ color: T.sand, fontWeight: 800, fontSize: 16, textAlign: "center", margin: "0 0 24px" }}>Share this post</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24 }}>
          {options.map(([icon, label]) => (
            <button key={label} onClick={label.includes("link") || label === "Copied!" ? copy : undefined}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: T.textDim, fontSize: 12, fontWeight: 600 }}>
              <span style={{ fontSize: 26, background: T.bg, borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <div style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: T.muted, wordBreak: "break-all" }}>{link}</div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────
function PostCard({ post, onLike, onComment, onDelete, onShare }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef();

  const submit = () => {
    if (!draft.trim()) return;
    onComment(post.id, draft.trim());
    setDraft("");
    setOpen(true);
  };

  return (
    <article style={{ background: T.card, borderRadius: 20, overflow: "hidden", border: `1px solid ${T.cardBorder}`, marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}>
        <Avatar name="Neha" size={38} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.sand }}>neha.creates</p>
          <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{post.timestamp}</p>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8 }}>
            <Icon.Dots />
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", right: 0, top: "110%", background: "#1e2130", border: `1px solid ${T.cardBorder}`, borderRadius: 12, zIndex: 50, minWidth: 150, overflow: "hidden", boxShadow: "0 8px 32px #000a" }}>
              <button onClick={() => { onDelete(post.id); setMenuOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: T.coral, fontSize: 14, fontWeight: 600 }}>
                <Icon.Trash /> Delete post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      <div style={{ position: "relative", paddingTop: "100%", background: T.bg }}>
        <img src={post.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
      </div>

      {/* Actions */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          <button onClick={() => onLike(post.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.Heart filled={post.liked} />
            <span style={{ fontSize: 13, fontWeight: 700, color: post.liked ? T.coral : T.mutedLight }}>{post.likes}</span>
          </button>
          <button onClick={() => { setOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.Comment />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.mutedLight }}>{post.comments.length}</span>
          </button>
          <button onClick={() => onShare(post)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto" }}>
            <Icon.Share />
          </button>
        </div>

        {/* Caption */}
        <p style={{ margin: "0 0 10px", fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: T.sand }}>neha.creates </span>
          {post.caption}
        </p>

        {/* Comments toggle */}
        {post.comments.length > 0 && !open && (
          <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: T.muted, fontSize: 12, marginBottom: 10 }}>
            View {post.comments.length} comment{post.comments.length > 1 ? "s" : ""}
          </button>
        )}

        {/* Comments list */}
        {open && post.comments.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <Avatar name={c.avatar} size={28} />
            <div style={{ background: T.bg, borderRadius: 10, padding: "8px 12px", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, color: T.sand }}><span style={{ fontWeight: 700 }}>{c.user}</span> <span style={{ color: T.textDim }}>{c.text}</span></p>
            </div>
          </div>
        ))}

        {/* Comment input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${T.cardBorder}`, paddingTop: 10, paddingBottom: 14 }}>
          <Avatar name="Neha" size={28} />
          <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Add a comment…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: T.sand, caretColor: T.coral }} />
          {draft.trim() && (
            <button onClick={submit} style={{ background: "none", border: "none", cursor: "pointer", color: T.coral, fontWeight: 800, fontSize: 13 }}>Post</button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Add Post Modal ───────────────────────────────────────────────
function AddPostModal({ onAdd, onClose }) {
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef();

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPreview(ev.target.result); setImageUrl(""); };
    reader.readAsDataURL(file);
  };

  const loadUrl = () => { if (imageUrl.trim()) setPreview(imageUrl.trim()); };

  const canShare = !!preview;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 24, width: "100%", maxWidth: 420, overflow: "hidden", border: `1px solid ${T.cardBorder}` }}>
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${T.cardBorder}` }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 14 }}>Cancel</button>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: T.sand }}>New Post</p>
          <button onClick={() => { if (canShare) { onAdd(preview, caption); onClose(); } }} disabled={!canShare}
            style={{ background: canShare ? T.coral : "transparent", border: canShare ? "none" : `1px solid ${T.cardBorder}`, color: canShare ? "#fff" : T.muted, borderRadius: 10, padding: "8px 16px", cursor: canShare ? "pointer" : "default", fontWeight: 700, fontSize: 14, transition: "all 0.2s" }}>
            Share
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Preview area */}
          <div style={{ background: T.bg, borderRadius: 16, overflow: "hidden", marginBottom: 14, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {preview ? (
              <img src={preview} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>📷</div>
                <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Your photo will appear here</p>
              </div>
            )}
          </div>

          {/* Upload button */}
          <button onClick={() => fileRef.current.click()} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px dashed ${T.cardBorder}`, background: "transparent", color: T.textDim, fontSize: 14, cursor: "pointer", marginBottom: 10, fontWeight: 600 }}>
            📁 Upload from device
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />

          {/* URL row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && loadUrl()}
              placeholder="Or paste an image URL…"
              style={{ flex: 1, background: T.bg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", color: T.sand, caretColor: T.coral }} />
            <button onClick={loadUrl} style={{ background: T.coral, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>Load</button>
          </div>

          {/* Caption */}
          <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a caption…" rows={3}
            style={{ width: "100%", background: T.bg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "12px", fontSize: 13, outline: "none", resize: "none", color: T.sand, caretColor: T.coral, boxSizing: "border-box", lineHeight: 1.5 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [tab, setTab] = useState("feed");
  const [sharePost, setSharePost] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handleLike = id => setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  const handleComment = (id, text) => setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: Date.now(), user: "neha.creates", text, avatar: "N" }] } : p));
  const handleDelete = id => { setPosts(ps => ps.filter(p => p.id !== id)); showToast("Post deleted"); };
  const handleAdd = (image, caption) => {
    setPosts(ps => [{ id: Date.now(), image, caption: caption || "✨", likes: 0, liked: false, comments: [], timestamp: "Just now" }, ...ps]);
    showToast("Post shared!");
  };

  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: T.sand }}>

      {/* Top nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: T.bg, borderBottom: `1px solid ${T.cardBorder}` }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-1px", background: `linear-gradient(90deg, ${T.coral}, ${T.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            pulse
          </span>
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: T.coral, color: "#fff", border: "none", borderRadius: 12, padding: "9px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            <Icon.Plus /> New post
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 60 }}>

        {/* Profile hero */}
        <section style={{ padding: "28px 20px 24px", borderBottom: `1px solid ${T.cardBorder}` }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 18 }}>
            {/* Avatar with conic gradient ring — the signature element */}
            <div style={{ position: "relative", flexShrink: 0, width: 86, height: 86 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(#ff6b6b 0%, #f7c948 33%, #6bcb8b 66%, #7c9ef5 85%, #ff6b6b 100%)", padding: 3 }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 32, color: T.coral }}>N</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 24 }}>
              {[["Posts", posts.length], ["Likes", totalLikes], ["Comments", posts.reduce((s, p) => s + p.comments.length, 0)]].map(([label, val]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontWeight: 900, fontSize: 22, color: T.sand, lineHeight: 1 }}>{val}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: T.muted, fontWeight: 500 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 17, color: T.sand }}>Neha Sharma</p>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: T.coral }}>@neha.creates · Delhi, India</p>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: T.textDim, lineHeight: 1.6 }}>
            Visual storyteller & content creator 📸<br />Sharing slices of life, food &amp; faraway places.
          </p>
          <button style={{ width: "100%", padding: "11px", borderRadius: 12, border: `1.5px solid ${T.cardBorder}`, background: "transparent", color: T.sand, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Edit profile
          </button>
        </section>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.cardBorder}`, position: "sticky", top: 57, zIndex: 100, background: T.bg }}>
          {[["feed", <Icon.Feed />, "Feed"], ["grid", <Icon.Grid />, "Grid"]].map(([key, icon, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, color: tab === key ? T.coral : T.muted, borderBottom: tab === key ? `2px solid ${T.coral}` : "2px solid transparent", transition: "color 0.15s" }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "16px 12px 0" }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: T.muted }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
              <p style={{ fontWeight: 800, fontSize: 18, color: T.sand, margin: "0 0 8px" }}>Nothing here yet</p>
              <p style={{ fontSize: 14, margin: "0 0 24px", color: T.muted }}>Share your first post with your followers</p>
              <button onClick={() => setShowAdd(true)} style={{ background: T.coral, color: "#fff", border: "none", borderRadius: 14, padding: "13px 30px", cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
                Create your first post
              </button>
            </div>
          ) : tab === "feed" ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} onDelete={handleDelete} onShare={setSharePost} />
            ))
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, borderRadius: 16, overflow: "hidden" }}>
              {posts.map(post => (
                <div key={post.id} onClick={() => setTab("feed")} style={{ position: "relative", paddingTop: "100%", cursor: "pointer", background: T.bg, overflow: "hidden" }}>
                  <img src={post.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.2s" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, opacity: 0, background: "#000a", transition: "opacity 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>❤️ {post.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showAdd && <AddPostModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {sharePost && <ShareSheet post={sharePost} onClose={() => setSharePost(null)} />}
      {toast && <Toast msg={toast} />}
    </div>
  );
}
