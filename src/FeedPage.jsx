import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", error: "#f87171",
};

/* ── Single Post Card ── */
function PostCard({ post, session, onDeleted }) {
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting]   = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMine = post.user_id === session.userId;

  const fetchLikes = async () => {
    const { data, count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact" })
      .eq("post_id", post.id);
    setLikeCount(count || 0);
    setLiked(!!(data || []).find(l => l.user_id === session.userId));
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select("*, profiles(name, photo)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  useEffect(() => { fetchLikes(); fetchComments(); }, [post.id]);

  const toggleLike = async () => {
    if (liked) {
      await supabase.from("post_likes").delete()
        .eq("post_id", post.id).eq("user_id", session.userId);
      setLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: session.userId });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    await supabase.from("post_comments").insert({
      post_id: post.id, user_id: session.userId, content: commentText.trim(),
    });
    setCommentText("");
    setPosting(false);
    fetchComments();
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Check this out on TezConnect", url });
      } catch {
        // user cancelled share — ignore
      }
    } else {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const deletePost = async () => {
    await supabase.from("posts").delete().eq("id", post.id);
    setConfirmDelete(false);
    onDeleted(post.id);
  };

  const author = post.profiles || {};
  const initials = (author.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return `${Math.floor(diff/86400)}d`;
  };

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "linear-gradient(135deg,#f97316,#ea6008)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: "#fff",
          overflow: "hidden", flexShrink: 0,
        }}>
          {author.photo
            ? <img src={author.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{author.name || "Member"}</div>
          <div style={{ fontSize: 11, color: T.textLow }}>{timeAgo(post.created_at)} ago</div>
        </div>

        {/* Menu */}
        {isMine && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(s => !s)}
              style={{ background: "none", border: "none", color: T.textLow, fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}
            >
              ⋯
            </button>
            {showMenu && (
              <div
                onClick={() => setShowMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 10 }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: "absolute", top: "100%", right: 0, marginTop: 4,
                    background: T.bgInput, border: `1px solid ${T.border}`,
                    borderRadius: 10, overflow: "hidden", zIndex: 11, minWidth: 150,
                    boxShadow: "0 8px 24px #00000066",
                  }}
                >
                  <button
                    onClick={() => { setShowMenu(false); setConfirmDelete(true); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "10px 14px",
                      background: "none", border: "none", color: T.error,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    🗑 Delete Post
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media */}
      {post.media_type === "video" && post.media_url && (
        <video
          src={post.media_url}
          controls
          playsInline
          style={{ width: "100%", maxHeight: 500, background: "#000", display: "block" }}
        />
      )}
      {post.media_type === "image" && post.media_url && (
        <img
          src={post.media_url}
          alt=""
          style={{ width: "100%", maxHeight: 500, objectFit: "cover", display: "block" }}
        />
      )}

      {/* Caption */}
      {post.caption && (
        <div style={{ padding: "12px 16px 0", fontSize: 13, color: T.text, lineHeight: 1.6 }}>
          <strong>{author.name?.split(" ")[0]}</strong> {post.caption}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px" }}>
        <button
          onClick={toggleLike}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: liked ? T.error : T.textMid, fontSize: 13, fontWeight: 700, padding: 0 }}
        >
          <span style={{ fontSize: 20 }}>{liked ? "❤️" : "🤍"}</span>
          {likeCount > 0 && likeCount}
        </button>
        <button
          onClick={() => setShowComments(s => !s)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: T.textMid, fontSize: 13, fontWeight: 700, padding: 0 }}
        >
          <span style={{ fontSize: 20 }}>💬</span>
          {comments.length > 0 && comments.length}
        </button>
        <button
          onClick={sharePost}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: shareCopied ? T.success : T.textMid, fontSize: 13, fontWeight: 700, padding: 0 }}
        >
          <span style={{ fontSize: 20 }}>↗️</span>
          {shareCopied ? "Copied!" : "Share"}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.length === 0 ? (
            <div style={{ fontSize: 12, color: T.textLow, textAlign: "center", padding: "8px 0" }}>
              No comments yet — be the first!
            </div>
          ) : (
            comments.map(c => {
              const cAuthor = c.profiles || {};
              const cInitials = (cAuthor.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#f97316,#ea6008)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "#fff", overflow: "hidden",
                  }}>
                    {cAuthor.photo
                      ? <img src={cAuthor.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : cInitials
                    }
                  </div>
                  <div style={{ flex: 1, background: T.bgInput, borderRadius: 10, padding: "8px 12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 2 }}>{cAuthor.name || "Member"}</div>
                    <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>{c.content}</div>
                  </div>
                </div>
              );
            })
          )}

          {/* Add comment */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addComment()}
              placeholder="Add a comment…"
              style={{
                flex: 1, background: T.bgInput, border: `1px solid ${T.border}`,
                borderRadius: 20, padding: "8px 14px", color: T.text,
                fontSize: 12, outline: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <button
              onClick={addComment}
              disabled={posting || !commentText.trim()}
              style={{
                background: commentText.trim() ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgInput,
                border: "none", borderRadius: 20, padding: "8px 16px",
                color: commentText.trim() ? "#fff" : T.textLow,
                fontSize: 12, fontWeight: 700,
                cursor: commentText.trim() ? "pointer" : "default",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {posting ? "…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(false)}
          style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px", maxWidth: 320, width: "100%", textAlign: "center" }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 8 }}>Delete this post?</div>
            <div style={{ fontSize: 13, color: T.textMid, marginBottom: 20, lineHeight: 1.6 }}>This cannot be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px", color: T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={deletePost}
                style={{ flex: 1, background: "#f8717112", border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Create Post Modal ── */
function CreatePostModal({ session, onClose, onCreated }) {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { setError("File must be under 50MB."); return; }
    const type = f.type.startsWith("video") ? "video" : "image";
    setMediaType(type);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const handlePost = async () => {
    if (!file && !caption.trim()) { setError("Add a photo, video, or write something."); return; }
    setUploading(true);
    setError("");

    let mediaUrl = null;
    let finalType = "text";

    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${session.userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("posts").upload(path, file, {
        contentType: file.type,
      });
      if (upErr) {
        setError("Upload failed: " + upErr.message);
        setUploading(false);
        return;
      }
      const { data } = supabase.storage.from("posts").getPublicUrl(path);
      mediaUrl = data.publicUrl;
      finalType = mediaType;
    }

    const { error: insErr } = await supabase.from("posts").insert({
      user_id: session.userId,
      media_url: mediaUrl,
      media_type: finalType,
      caption: caption.trim(),
    });

    setUploading(false);

    if (insErr) {
      setError("Could not save post: " + insErr.message);
      return;
    }

    onCreated();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 20, padding: "24px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>📸 Create Post</div>
          <button
            onClick={onClose}
            style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ background: "#f8717112", border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 16, lineHeight: 1.5 }}>
            ⚠ {error}
          </div>
        )}

        {/* Preview / upload area */}
        <div
          onClick={() => !preview && fileRef.current.click()}
          style={{
            width: "100%", minHeight: 200, borderRadius: 12,
            border: `2px dashed ${T.border}`, background: T.bgInput,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: preview ? "default" : "pointer", overflow: "hidden",
            position: "relative", marginBottom: 16,
          }}
        >
          {preview ? (
            mediaType === "video"
              ? <video src={preview} controls style={{ width: "100%", maxHeight: 320 }} />
              : <img src={preview} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "contain" }} />
          ) : (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 13, color: T.textMid, fontWeight: 600 }}>Tap to add photo or video</div>
              <div style={{ fontSize: 11, color: T.textLow, marginTop: 4 }}>Max 50MB</div>
            </div>
          )}
          {preview && (
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
              style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "#000a", border: "none", color: "#fff", fontSize: 14, cursor: "pointer" }}
            >
              ×
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display: "none" }} />

        {/* Caption */}
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption…"
          rows={3}
          style={{
            width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: "10px 14px", color: T.text,
            fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box",
            fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 16,
          }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />

        <button
          onClick={handlePost}
          disabled={uploading}
          style={{
            width: "100%",
            background: uploading ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)",
            border: "none", borderRadius: 10, padding: "12px",
            color: uploading ? T.textMid : "#fff", fontSize: 14, fontWeight: 700,
            cursor: uploading ? "wait" : "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: uploading ? "none" : "0 4px 20px #f9731440",
          }}
        >
          {uploading ? "Posting…" : "Share Post 🚀"}
        </button>
      </div>
    </div>
  );
}

/* ── Main Feed Page ── */
export default function FeedPage({ session }) {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(name, photo)")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setPosts([]);
    } else {
      setError(null);
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDeleted = (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
            📸 Feed
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: "-.03em" }}>
            Community <span style={{ color: T.orange }}>Posts</span>
          </h2>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            background: "linear-gradient(135deg,#f97316,#ea6008)",
            border: "none", borderRadius: 10, padding: "10px 20px",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 4px 16px #f9731440",
          }}
        >
          + Post
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div style={{ background: "#f8717112", border: `1px solid ${T.error}44`, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.error, marginBottom: 6 }}>Couldn't load feed</div>
          <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6, marginBottom: 12 }}>{error}</div>
          <button
            onClick={fetchPosts}
            style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "8px 20px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
          <div style={{ width: 20, height: 20, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading feed…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && posts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📸</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>No posts yet</div>
          <div style={{ color: T.textMid, fontSize: 13, marginBottom: 20 }}>Be the first to share a photo, video, or update</div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            + Create First Post
          </button>
        </div>
      )}

      {/* Posts */}
      {!loading && !error && posts.map(post => (
        <PostCard key={post.id} post={post} session={session} onDeleted={handleDeleted} />
      ))}

      {/* Create modal */}
      {showCreate && (
        <CreatePostModal
          session={session}
          onClose={() => setShowCreate(false)}
          onCreated={fetchPosts}
        />
      )}
    </div>
  );
}
