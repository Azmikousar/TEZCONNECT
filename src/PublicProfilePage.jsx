import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useConnections } from "./useConnections";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171",
};

export default function PublicProfilePage({ userId, session, onBack }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postStats, setPostStats] = useState({ likes: 0, comments: 0 });
  const [mutuals, setMutuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("grid");
  const [selectedPost, setSelectedPost] = useState(null);
  const isMe = userId === session?.userId;

  const { getStatus, sendRequest, acceptRequest, rejectRequest, removeConnection, accepted } = useConnections(session?.userId);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);

      const [{ data: p }, { data: postsData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      setProfile(p || {});
      const pList = postsData || [];
      setPosts(pList);

      // get total likes and comments
      const ids = pList.map(p => p.id);
      if (ids.length > 0) {
        const [{ count: lc }, { count: cc }] = await Promise.all([
          supabase.from("post_likes").select("*", { count: "exact", head: true }).in("post_id", ids),
          supabase.from("post_comments").select("*", { count: "exact", head: true }).in("post_id", ids),
        ]);
        setPostStats({ likes: lc || 0, comments: cc || 0 });
      }

      // mutual connections
      if (session?.userId && !isMe) {
        const { data: myConns } = await supabase
          .from("connections").select("requester_id,receiver_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${session.userId},receiver_id.eq.${session.userId}`);

        const myIds = (myConns || []).map(c =>
          c.requester_id === session.userId ? c.receiver_id : c.requester_id
        );

        const { data: theirConns } = await supabase
          .from("connections").select("requester_id,receiver_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

        const theirIds = (theirConns || []).map(c =>
          c.requester_id === userId ? c.receiver_id : c.requester_id
        );

        const mutualIds = myIds.filter(id => theirIds.includes(id) && id !== userId).slice(0, 3);
        if (mutualIds.length > 0) {
          const { data: mutualProfiles } = await supabase.from("profiles").select("id,name,photo").in("id", mutualIds);
          setMutuals(mutualProfiles || []);
        }
      }

      setLoading(false);
    };
    load();
  }, [userId, session?.userId, isMe]);

  const { status, connection, isSender } = getStatus(userId);
  const [connLoading, setConnLoading] = useState(false);

  const handleConn = async (action) => {
    setConnLoading(true);
    try {
      if (action === "send")   await sendRequest(userId);
      if (action === "accept") await acceptRequest(connection?.id);
      if (action === "remove") await removeConnection(connection?.id);
    } finally { setConnLoading(false); }
  };

  const openChat = () => {
    window.dispatchEvent(new CustomEvent("tez-navigate", { detail: { page: "messages" } }));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("tez-open-chat", { detail: { userId } }));
    }, 200);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?profile=${userId}`;
    if (navigator.share) navigator.share({ title: profile?.name, url });
    else navigator.clipboard.writeText(url).then(() => alert("Profile link copied!"));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 12 }}>
        <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: T.orange, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
        <span style={{ color: T.textMid, fontSize: 13 }}>Loading profile…</span>
      </div>
    );
  }

  if (!profile) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <div style={{ color: T.textMid }}>Profile not found</div>
    </div>
  );

  const avatarColors = ["#f97316", "#a78bfa", "#38bdf8", "#22c55e", "#f43f5e"];
  const initials = (profile.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const ringColor = avatarColors[(profile.name || "").charCodeAt(0) % avatarColors.length];

  const socialLinks = [
    profile.instagram && { icon: "📸", label: "Instagram", url: `https://instagram.com/${profile.instagram.replace("@", "")}` },
    profile.youtube && { icon: "▶️", label: "YouTube", url: profile.youtube.startsWith("http") ? profile.youtube : `https://youtube.com/${profile.youtube}` },
    profile.linkedin && { icon: "💼", label: "LinkedIn", url: profile.linkedin.startsWith("http") ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}` },
    profile.website && { icon: "🌐", label: "Website", url: profile.website.startsWith("http") ? profile.website : `https://${profile.website}` },
    profile.whatsapp && { icon: "💬", label: "WhatsApp", url: `https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}` },
  ].filter(Boolean);

  const ConnectButton = () => {
    if (isMe) return null;
    if (status === "accepted") return (
      <button onClick={() => handleConn("remove")} disabled={connLoading}
        style={{ flex: 1, background: T.successLo, border: `1.5px solid ${T.success}55`, borderRadius: 10, padding: "11px", color: T.success, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        {connLoading ? "…" : "✓ Connected"}
      </button>
    );
    if (status === "pending" && isSender) return (
      <button onClick={() => handleConn("remove")} disabled={connLoading}
        style={{ flex: 1, background: "transparent", border: `1.5px solid ${T.orange}`, borderRadius: 10, padding: "11px", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        {connLoading ? "…" : "Requested"}
      </button>
    );
    if (status === "pending" && !isSender) return (
      <button onClick={() => handleConn("accept")} disabled={connLoading}
        style={{ flex: 1, background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px #f9731444" }}>
        {connLoading ? "…" : "Accept"}
      </button>
    );
    return (
      <button onClick={() => handleConn("send")} disabled={connLoading}
        style={{ flex: 1, background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px #f9731444" }}>
        {connLoading ? "…" : "Connect"}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, background: T.bg, minHeight: "100vh" }}>

      {/* Back bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.bgCard, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: T.text, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>←</button>
        )}
        <div style={{ fontWeight: 800, fontSize: 16, color: T.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {profile.name || "Profile"}
        </div>
        <button style={{ background: "none", border: "none", color: T.textMid, fontSize: 20, cursor: "pointer" }}>⋯</button>
      </div>

      {/* Profile header */}
      <div style={{ padding: "20px 16px 0" }}>

        {/* Avatar + Stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>

          {/* Avatar with gradient ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 86, height: 86, borderRadius: "50%",
              background: `conic-gradient(${ringColor}, #f97316, #fbbf24, ${ringColor})`,
              padding: 3, boxSizing: "border-box",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: T.bg, padding: 3, boxSizing: "border-box" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: `linear-gradient(135deg,${ringColor},#f97316)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff" }}>
                  {profile.photo
                    ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ flex: 1, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            {[
              { value: posts.length, label: "Posts" },
              { value: postStats.likes, label: "Likes" },
              { value: postStats.comments, label: "Comments" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: T.text, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Name + designation */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{profile.name}</div>
          {profile.designation && <div style={{ fontSize: 13, color: T.orange, fontWeight: 600, marginTop: 2 }}>{profile.designation}</div>}
          {profile.company && <div style={{ fontSize: 12, color: T.textMid, marginTop: 1 }}>🏢 {profile.company}</div>}
        </div>

        {/* Location */}
        {profile.location && (
          <div style={{ fontSize: 12, color: T.textMid, marginBottom: 6 }}>📍 {profile.location}</div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, marginBottom: 10 }}>{profile.bio}</div>
        )}

        {/* Industry / category tags */}
        {(profile.industry || profile.category) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {profile.industry && <span style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, color: T.orange, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{profile.industry}</span>}
            {profile.category && <span style={{ background: "#a78bfa12", border: "1px solid #a78bfa33", color: "#a78bfa", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{profile.category}</span>}
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {socialLinks.map(link => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 5, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 20, padding: "5px 12px", textDecoration: "none" }}>
                <span style={{ fontSize: 13 }}>{link.icon}</span>
                <span style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>{link.label}</span>
              </a>
            ))}
          </div>
        )}

        {/* Mutual connections */}
        {mutuals.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ display: "flex" }}>
              {mutuals.map((m, i) => (
                <div key={m.id} style={{ width: 22, height: 22, borderRadius: "50%", marginLeft: i > 0 ? -8 : 0, border: `2px solid ${T.bg}`, background: `linear-gradient(135deg,#f97316,#ea6008)`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>
                  {m.photo ? <img src={m.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (m.name || "?")[0]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: T.textMid }}>
              Connected with {mutuals.map(m => m.name?.split(" ")[0]).join(", ")}
              {mutuals.length < accepted.length && " and others"}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {isMe ? (
            <>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("tez-navigate", { detail: { page: "profile" } }))}
                style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px", color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✏️ Edit Profile
              </button>
              <button onClick={handleShare}
                style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px", color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                📤 Share Profile
              </button>
            </>
          ) : (
            <>
              <ConnectButton />
              <button onClick={openChat}
                style={{ flex: 1, background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px #f9731440" }}>
                💬 Message
              </button>
              <button onClick={handleShare}
                style={{ width: 42, height: 42, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>
                📤
              </button>
            </>
          )}
        </div>
      </div>

      {/* Highlights strip (categories as highlights) */}
      {(profile.industry || profile.category || profile.location || profile.website) && (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              profile.industry && { emoji: "🏭", label: profile.industry },
              profile.category && { emoji: "🎯", label: profile.category },
              profile.location && { emoji: "📍", label: profile.location?.split(",")[0] },
              profile.website && { emoji: "🌐", label: "Website" },
            ].filter(Boolean).map((h, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: `conic-gradient(${ringColor}, #f97316, #fbbf24, ${ringColor})`,
                  padding: 2, boxSizing: "border-box",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {h.emoji}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: T.textMid, fontWeight: 600, maxWidth: 64, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: T.border }} />

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
        {[
          { id: "grid",  icon: "⊞" },
          { id: "feed",  icon: "☰" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "12px", background: "none", border: "none",
            color: tab === t.id ? T.orange : T.textLow, fontSize: 18, cursor: "pointer",
            borderBottom: tab === t.id ? `2px solid ${T.orange}` : "2px solid transparent",
          }}>{t.icon}</button>
        ))}
      </div>

      {/* Posts grid */}
      {tab === "grid" && (
        <div>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>No posts yet</div>
              <div style={{ fontSize: 13, color: T.textLow }}>
                {isMe ? "Share your first post to get started" : `${profile.name?.split(" ")[0]} hasn't posted yet`}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              {posts.map((post, i) => (
                <div key={post.id} onClick={() => setSelectedPost(post)}
                  style={{ aspectRatio: "1", overflow: "hidden", background: T.bgInput, cursor: "pointer", position: "relative" }}>
                  {post.image_url ? (
                    <img src={post.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
                      <p style={{ fontSize: 10, color: T.textMid, textAlign: "center", overflow: "hidden", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                        {post.content}
                      </p>
                    </div>
                  )}
                  {post.video_url && (
                    <div style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, background: "#000a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff" }}>▶</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts feed */}
      {tab === "feed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>No posts yet</div>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} style={{ background: T.bgCard, borderBottom: `1px solid ${T.border}` }}>
                {post.image_url && (
                  <img src={post.image_url} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "cover" }} />
                )}
                {post.content && (
                  <div style={{ padding: "12px 16px" }}>
                    <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{post.content}</p>
                    <div style={{ fontSize: 11, color: T.textLow, marginTop: 8 }}>
                      {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <div onClick={() => setSelectedPost(null)} style={{ position: "fixed", inset: 0, background: "#000e", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, borderRadius: 16, width: "90%", maxWidth: 480, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {selectedPost.image_url && (
              <img src={selectedPost.image_url} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
            )}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar name={profile.name} photo={profile.photo} size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{profile.name}</div>
                  <div style={{ fontSize: 11, color: T.textLow }}>{new Date(selectedPost.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                <button onClick={() => setSelectedPost(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: T.textMid, fontSize: 20, cursor: "pointer" }}>×</button>
              </div>
              {selectedPost.content && <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{selectedPost.content}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ name, photo, size = 44 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["linear-gradient(135deg,#f97316,#ea6008)", "linear-gradient(135deg,#7c3aed,#a78bfa)"];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: colors[(name || "A").charCodeAt(0) % colors.length], overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, color: "#fff" }}>
      {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  );
}
