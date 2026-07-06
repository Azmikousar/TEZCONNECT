import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  amber: "#fbbf24", info: "#38bdf8",
};

function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return "now";
  if (d < 3600) return `${Math.floor(d/60)}m`;
  if (d < 86400) return `${Math.floor(d/3600)}h`;
  return `${Math.floor(d/86400)}d`;
}

/* ── Post Card ── */
function PostCard({ post, session }) {
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments]   = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting]     = useState(false);

  useEffect(() => {
    supabase.from("post_likes").select("*", { count: "exact" }).eq("post_id", post.id)
      .then(({ data, count }) => {
        setLikeCount(count || 0);
        setLiked(!!(data || []).find(l => l.user_id === session?.userId));
      });
    supabase.from("post_comments").select("*, profiles(name, photo)")
      .eq("post_id", post.id).order("created_at", { ascending: true })
      .then(({ data }) => setComments(data || []));
  }, [post.id]);

  const toggleLike = async () => {
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", session.userId);
      setLiked(false); setLikeCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: session.userId });
      setLiked(true); setLikeCount(c => c + 1);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    await supabase.from("post_comments").insert({ post_id: post.id, user_id: session.userId, content: commentText.trim() });
    setCommentText(""); setPosting(false);
    const { data } = await supabase.from("post_comments").select("*, profiles(name, photo)")
      .eq("post_id", post.id).order("created_at", { ascending: true });
    setComments(data || []);
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) { try { await navigator.share({ title: "Check this on TezConnect", url }); } catch {} }
    else { navigator.clipboard.writeText(url); }
  };

  const author = post.profiles || {};
  const initials = (author.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ background: T.bgCard, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
          {author.photo ? <img src={author.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{author.name || "Member"}</div>
          <div style={{ fontSize: 11, color: T.textLow }}>{timeAgo(post.created_at)} ago</div>
        </div>
      </div>

      {/* Media */}
      {post.media_type === "video" && post.media_url && (
        <video src={post.media_url} controls playsInline style={{ width: "100%", maxHeight: 400, background: "#000", display: "block" }} />
      )}
      {post.media_type === "image" && post.media_url && (
        <img src={post.media_url} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }} />
      )}

      {/* Actions */}
      <div style={{ padding: "10px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <button onClick={toggleLike}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, padding: 0, transition: "transform .1s" }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(1.3)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {liked ? "❤️" : "🤍"}
          </button>
          <button onClick={() => setShowComments(s => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 0 }}>
            💬
          </button>
          <button onClick={sharePost}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 0 }}>
            ↗️
          </button>
        </div>

        {likeCount > 0 && (
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </div>
        )}

        {post.caption && (
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, marginBottom: 6 }}>
            <strong>{author.name?.split(" ")[0]}</strong> {post.caption}
          </div>
        )}

        {comments.length > 0 && !showComments && (
          <button onClick={() => setShowComments(true)}
            style={{ background: "none", border: "none", color: T.textLow, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 8 }}>
            View all {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${T.border}`, marginTop: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12, maxHeight: 180, overflowY: "auto" }}>
            {comments.map(c => {
              const ca = c.profiles || {};
              const ci = (ca.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
                    {ca.photo ? <img src={ca.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ci}
                  </div>
                  <div style={{ flex: 1, background: T.bgInput, borderRadius: 10, padding: "7px 11px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text, marginRight: 6 }}>{ca.name || "Member"}</span>
                    <span style={{ fontSize: 12, color: T.textMid }}>{c.content}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addComment()}
              placeholder="Add a comment…"
              style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 20, padding: "8px 14px", color: T.text, fontSize: 12, outline: "none", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <button onClick={addComment} disabled={posting || !commentText.trim()}
              style={{ background: commentText.trim() ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgInput, border: "none", borderRadius: 20, padding: "8px 16px", color: commentText.trim() ? "#fff" : T.textLow, fontSize: 12, fontWeight: 700, cursor: commentText.trim() ? "pointer" : "default", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {posting ? "…" : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Grid Item ── */
function GridItem({ post, onClick }) {
  return (
    <div onClick={() => onClick(post)} style={{ aspectRatio: "1", overflow: "hidden", position: "relative", background: T.bgInput, cursor: "pointer" }}>
      {post.media_type === "video" && post.media_url
        ? <video src={post.media_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
        : post.media_url
        ? <img src={post.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: T.bgHover, padding: 8 }}>
            <p style={{ fontSize: 11, color: T.textMid, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{post.caption}</p>
          </div>
      }
      {post.media_type === "video" && <div style={{ position: "absolute", top: 6, right: 6, fontSize: 12 }}>▶️</div>}
    </div>
  );
}

/* ── Post Detail Modal (from grid tap) ── */
function PostDetailModal({ post, session, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000e", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>
        <div style={{ paddingBottom: 40 }}>
          <PostCard post={post} session={session} />
        </div>
      </div>
    </div>
  );
}

/* ── Social link pill ── */
function SocialPill({ icon, label, url }) {
  if (!url) return null;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 7, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 14px", color: T.text, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
      <span>{icon}</span> {label}
    </a>
  );
}

/* ── Main User Profile Modal ── */
export default function UserProfileModal({ userId, session, onClose, connectionProps }) {
  const [profile, setProfile]     = useState(null);
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [view, setView]           = useState("feed");
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [copied, setCopied]       = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Load profile
    supabase.from("profiles").select("*").eq("id", userId).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });

    // Load posts
    supabase.from("posts").select("*, profiles(name, photo)")
      .eq("user_id", userId).order("created_at", { ascending: false })
      .then(async ({ data }) => {
        setPosts(data || []);
        setPostsLoading(false);
        if (data?.length) {
          const ids = data.map(p => p.id);
          const [{ count: lc }, { count: cc }] = await Promise.all([
            supabase.from("post_likes").select("*", { count: "exact", head: true }).in("post_id", ids),
            supabase.from("post_comments").select("*", { count: "exact", head: true }).in("post_id", ids),
          ]);
          setLikeCount(lc || 0);
          setCommentCount(cc || 0);
        }
      });
  }, [userId]);

  const shareProfile = () => {
    const url = profile?.username
      ? `${window.location.origin}/u/${profile.username}`
      : `${window.location.origin}/?user=${userId}`;
    if (navigator.share) {
      navigator.share({ title: profile?.name + " on TezConnect", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* Open a chat with this user from wherever the profile is being viewed.
     MessagesPage.jsx already listens for this exact event, so this works
     without any extra wiring — the modal just closes and Messages opens
     the chat. */
  const messageUser = () => {
    window.dispatchEvent(new CustomEvent("tez-open-chat", { detail: { userId } }));
    onClose();
  };

  const isMe = userId === session?.userId;
  const initials = (profile?.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // Connection status
  const connStatus = connectionProps ? connectionProps.getStatus(userId) : null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 600 }} />
      {/* Full screen slide-up panel */}
      <div style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        height: "100vh",
        background: T.bg,
        borderRadius: "0px",
        zIndex: 601,
        display: "flex",
        flexDirection: "column",
        animation: "slideUp .3s ease",
        maxWidth: 600,
        margin: "0 auto",
        width: "100%"
      }}>

        {/* Handle */}
        <div style={{ padding: "10px 0 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>

        {/* Sticky top bar */}
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.bgCard }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>
            {loading ? "…" : profile?.username ? `@${profile.username}` : profile?.name}
          </div>
          <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 30, height: 30, color: T.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
              <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            </div>
          ) : !profile ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>Profile not found</div>
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div style={{ padding: "20px 16px 0", background: T.bgCard, borderBottom: `1px solid ${T.border}` }}>

                {/* Avatar + stats */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                  <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0, border: `3px solid ${T.bgCard}`, boxShadow: `0 0 0 2px ${T.orange}` }}>
                    {profile.photo ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                  </div>
                  <div style={{ flex: 1, display: "flex", gap: 0 }}>
                    {[
                      [posts.length,    "Posts"],
                      [likeCount,       "Likes"],
                      [commentCount,    "Comments"],
                    ].map(([v, l], i) => (
                      <div key={l} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{v}</div>
                        <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Name + bio */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{profile.name}</div>
                  {profile.designation && <div style={{ fontSize: 13, color: T.orange, fontWeight: 600, marginTop: 2 }}>{profile.designation}</div>}
                  {profile.company && <div style={{ fontSize: 12, color: T.textMid, marginTop: 1 }}>{profile.company}{profile.industry ? " · " + profile.industry : ""}</div>}
                  {profile.location && <div style={{ fontSize: 12, color: T.textLow, marginTop: 3 }}>📍 {profile.location}</div>}
                  {profile.bio && <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6, marginTop: 6 }}>{profile.bio}</div>}

                  {/* Website link */}
                  {profile.website && (
                    <a href={/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: 8, fontSize: 13, color: T.orange, textDecoration: "underline", fontWeight: 600, wordBreak: "break-all" }}>
                      {profile.website}
                    </a>
                  )}

                  {/* Social links */}
                  {(profile.instagram || profile.linkedin || profile.twitter || profile.youtube) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      <SocialPill icon="📸" label="Instagram" url={profile.instagram} />
                      <SocialPill icon="🔗" label="LinkedIn" url={profile.linkedin} />
                      <SocialPill icon="🐦" label="Twitter" url={profile.twitter} />
                      <SocialPill icon="▶️" label="YouTube" url={profile.youtube} />
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {!isMe && (
                  <div style={{ marginBottom: 14 }}>
                    {/* Connection status — shown only while not yet connected, as its own row */}
                    {connectionProps && connStatus && connStatus.status !== "accepted" && (() => {
                      const { status, connection, isSender } = connStatus;
                      if (status === "none") return (
                        <button onClick={() => connectionProps.sendRequest(userId)}
                          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.orange}44`, borderRadius: 10, padding: "10px", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 10 }}>
                          🤝 Connect
                        </button>
                      );
                      if (status === "pending" && isSender) return (
                        <button onClick={() => connectionProps.removeConnection(connection.id)}
                          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px", color: T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 10 }}>
                          ⏳ Requested
                        </button>
                      );
                      if (status === "pending" && !isSender) return (
                        <button onClick={() => connectionProps.acceptRequest(connection.id)}
                          style={{ width: "100%", background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 10, padding: "10px", color: T.success, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 10 }}>
                          ✓ Accept Request
                        </button>
                      );
                      return null;
                    })()}

                    {/* Message + Share Profile — full-width row, primary action */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={messageUser}
                        style={{ flex: 2, background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 4px 14px #f9731444" }}>
                        💬 Message
                      </button>
                      <button onClick={shareProfile}
                        style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px", color: copied ? T.success : T.text, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, whiteSpace: "nowrap" }}>
                        {copied ? "✓ Copied" : "📤 Share Profile"}
                      </button>
                    </div>

                    {/* WhatsApp, kept as a small secondary link under the main row */}
                    {profile.whatsapp && (
                      <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10, background: "#25d36618", border: "1px solid #25d36633", borderRadius: 10, padding: "10px", color: "#25d366", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                )}

                {/* Feed / Grid toggle — Feed first + default, matching the fuller profile layout */}
                <div style={{ display: "flex", borderTop: `1px solid ${T.border}` }}>
                  {[["feed", "☰ Feed"], ["grid", "⊞ Grid"]].map(([id, label]) => (
                    <button key={id} onClick={() => setView(id)}
                      style={{ flex: 1, background: "none", border: "none", borderBottom: `2px solid ${view === id ? T.orange : "transparent"}`, color: view === id ? T.orange : T.textLow, fontWeight: 700, fontSize: 13, padding: "10px 0", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loading posts */}
              {postsLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
                  <div style={{ width: 20, height: 20, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                </div>
              )}

              {/* Empty posts */}
              {!postsLoading && posts.length === 0 && (
                <div style={{ textAlign: "center", padding: "50px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>No posts yet</div>
                  <div style={{ fontSize: 13, color: T.textLow }}>This member hasn't posted anything yet</div>
                </div>
              )}

              {/* Grid view */}
              {!postsLoading && posts.length > 0 && view === "grid" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, paddingBottom: 40 }}>
                  {posts.map(post => (
                    <GridItem key={post.id} post={post} onClick={setSelectedPost} />
                  ))}
                </div>
              )}

              {/* Feed view */}
              {!postsLoading && posts.length > 0 && view === "feed" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingBottom: 40 }}>
                  {posts.map((post, i) => (
                    <div key={post.id} style={{ borderBottom: i < posts.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <PostCard post={post} session={session} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Post detail from grid tap */}
      {selectedPost && (
        <PostDetailModal post={selectedPost} session={session} onClose={() => setSelectedPost(null)} />
      )}
    </>
  );
}
