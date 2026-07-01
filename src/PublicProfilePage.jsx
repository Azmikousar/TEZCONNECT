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

/* ── helpers ── */
function timeAgo(ts) {
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return "now";
  if (d < 3600) return `${Math.floor(d/60)}m`;
  if (d < 86400) return `${Math.floor(d/3600)}h`;
  return `${Math.floor(d/86400)}d`;
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
    if (f.size > 100 * 1024 * 1024) { setError("File must be under 100MB."); return; }
    setMediaType(f.type.startsWith("video") ? "video" : "image");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const handlePost = async () => {
    if (!file && !caption.trim()) { setError("Add a photo, video, or caption."); return; }
    setUploading(true);
    let mediaUrl = null, finalType = "text";
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${session.userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("posts").upload(path, file, { contentType: file.type });
      if (upErr) { setError(upErr.message); setUploading(false); return; }
      const { data } = supabase.storage.from("posts").getPublicUrl(path);
      mediaUrl = data.publicUrl;
      finalType = mediaType;
    }
    const { error: insErr } = await supabase.from("posts").insert({
      user_id: session.userId, media_url: mediaUrl, media_type: finalType, caption: caption.trim(),
    });
    setUploading(false);
    if (insErr) { setError(insErr.message); return; }
    onCreated(); onClose();
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#000e", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", animation:"slideUp .3s ease" }}>
        {/* Handle */}
        <div style={{ padding:"12px 0 0", display:"flex", justifyContent:"center" }}>
          <div style={{ width:40, height:4, background:T.border, borderRadius:4 }}/>
        </div>
        <div style={{ padding:"16px 20px 36px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:17, color:T.text }}>New Post</div>
            <button onClick={onClose} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:"50%", width:32, height:32, color:T.textMid, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>
          {error && <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px 14px", fontSize:12, color:T.error, marginBottom:14 }}>⚠ {error}</div>}

          {/* Upload area */}
          <div onClick={()=>!preview&&fileRef.current.click()} style={{ width:"100%", minHeight:220, borderRadius:14, border:`2px dashed ${preview?T.border:T.orange+"55"}`, background:T.bgInput, display:"flex", alignItems:"center", justifyContent:"center", cursor:preview?"default":"pointer", overflow:"hidden", position:"relative", marginBottom:16 }}>
            {preview ? (
              mediaType==="video"
                ? <video src={preview} controls style={{ width:"100%", maxHeight:320 }}/>
                : <img src={preview} alt="" style={{ width:"100%", maxHeight:320, objectFit:"contain" }}/>
            ) : (
              <div style={{ textAlign:"center", padding:30 }}>
                <div style={{ fontSize:48, marginBottom:10 }}>📸</div>
                <div style={{ fontWeight:700, fontSize:14, color:T.textMid, marginBottom:6 }}>Tap to add photo or video</div>
                <div style={{ fontSize:12, color:T.textLow }}>JPG, PNG, MP4 · Max 100MB</div>
              </div>
            )}
            {preview && <button onClick={e=>{e.stopPropagation();setFile(null);setPreview(null);}} style={{ position:"absolute", top:10, right:10, width:28, height:28, borderRadius:"50%", background:"#000a", border:"none", color:"#fff", fontSize:14, cursor:"pointer" }}>×</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} style={{ display:"none" }}/>

          {/* Caption */}
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write a caption…" rows={3}
            style={{ width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", color:T.text, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:16 }}
            onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}
          />

          <button onClick={handlePost} disabled={uploading} style={{ width:"100%", background:uploading?"#1a1f35":"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"14px", color:uploading?T.textMid:"#fff", fontSize:15, fontWeight:700, cursor:uploading?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:uploading?"none":"0 4px 20px #f9731440" }}>
            {uploading ? "Sharing…" : "Share Post ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Post Card (full feed style) ── */
function PostCard({ post, session, onDeleted }) {
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments]   = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting]     = useState(false);
  const [showMenu, setShowMenu]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const isMine = post.user_id === session?.userId;

  useEffect(() => {
    supabase.from("post_likes").select("*",{count:"exact"}).eq("post_id",post.id)
      .then(({data,count})=>{setLikeCount(count||0);setLiked(!!(data||[]).find(l=>l.user_id===session?.userId));});
    supabase.from("post_comments").select("*,profiles(name,photo)").eq("post_id",post.id).order("created_at",{ascending:true})
      .then(({data})=>setComments(data||[]));
  },[post.id]);

  const toggleLike = async() => {
    if(liked){await supabase.from("post_likes").delete().eq("post_id",post.id).eq("user_id",session.userId);setLiked(false);setLikeCount(c=>Math.max(0,c-1));}
    else{await supabase.from("post_likes").insert({post_id:post.id,user_id:session.userId});setLiked(true);setLikeCount(c=>c+1);}
  };

  const addComment = async() => {
    if(!commentText.trim()||!session) return;
    setPosting(true);
    await supabase.from("post_comments").insert({post_id:post.id,user_id:session.userId,content:commentText.trim()});
    setCommentText("");setPosting(false);
    const {data}=await supabase.from("post_comments").select("*,profiles(name,photo)").eq("post_id",post.id).order("created_at",{ascending:true});
    setComments(data||[]);
  };

  const sharePost = async() => {
    const url=`${window.location.origin}/?post=${post.id}`;
    if(navigator.share){try{await navigator.share({title:"Check this on TezConnect",url});}catch{}}
    else{navigator.clipboard.writeText(url);}
  };

  const deletePost = async() => {
    await supabase.from("posts").delete().eq("id",post.id);
    setConfirmDel(false);onDeleted(post.id);
  };

  const author = post.profiles||{};
  const initials=(author.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{ background:T.bgCard, borderRadius:16, overflow:"hidden", border:`1px solid ${T.border}`, marginBottom:2 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px" }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#ea6008)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", overflow:"hidden", flexShrink:0 }}>
          {author.photo?<img src={author.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{author.name||"Member"}</div>
          <div style={{ fontSize:11, color:T.textLow }}>{timeAgo(post.created_at)} ago</div>
        </div>
        {isMine && (
          <div style={{ position:"relative" }}>
            <button onClick={()=>setShowMenu(s=>!s)} style={{ background:"none", border:"none", color:T.textLow, fontSize:20, cursor:"pointer", padding:4, lineHeight:1 }}>⋯</button>
            {showMenu && (
              <>
                <div onClick={()=>setShowMenu(false)} style={{ position:"fixed", inset:0, zIndex:10 }}/>
                <div style={{ position:"absolute", top:"100%", right:0, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, zIndex:11, minWidth:130, boxShadow:"0 8px 24px #00000066" }}>
                  <button onClick={()=>{setShowMenu(false);setConfirmDel(true);}} style={{ width:"100%", textAlign:"left", padding:"10px 14px", background:"none", border:"none", color:T.error, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    🗑 Delete Post
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Media */}
      {post.media_type==="video"&&post.media_url&&(
        <video src={post.media_url} controls playsInline style={{ width:"100%", maxHeight:480, background:"#000", display:"block" }}/>
      )}
      {post.media_type==="image"&&post.media_url&&(
        <img src={post.media_url} alt="" style={{ width:"100%", maxHeight:480, objectFit:"cover", display:"block" }}/>
      )}

      {/* Actions */}
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:8 }}>
          <button onClick={toggleLike} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, padding:0, color:liked?T.error:T.textMid, fontSize:22, transition:"transform .1s" }}
            onMouseDown={e=>e.currentTarget.style.transform="scale(1.2)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
            {liked?"❤️":"🤍"}
          </button>
          <button onClick={()=>setShowComments(s=>!s)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, padding:0, color:T.textMid }}>💬</button>
          <button onClick={sharePost} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, padding:0, color:T.textMid }}>↗️</button>
        </div>

        {/* Like count */}
        {likeCount>0 && (
          <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:6 }}>
            {likeCount} {likeCount===1?"like":"likes"}
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div style={{ fontSize:13, color:T.text, lineHeight:1.6, marginBottom:8 }}>
            <strong>{author.name?.split(" ")[0]}</strong> {post.caption}
          </div>
        )}

        {/* Comments preview */}
        {comments.length>0 && !showComments && (
          <button onClick={()=>setShowComments(true)} style={{ background:"none", border:"none", color:T.textLow, fontSize:12, cursor:"pointer", padding:0, fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:6 }}>
            View all {comments.length} comment{comments.length!==1?"s":""}
          </button>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ padding:"0 16px 12px", borderTop:`1px solid ${T.border}`, marginTop:8 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8, paddingTop:12, maxHeight:200, overflowY:"auto" }}>
            {comments.map(c=>{
              const ca=c.profiles||{};
              const ci=(ca.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
              return (
                <div key={c.id} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#ea6008)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#fff", overflow:"hidden", flexShrink:0 }}>
                    {ca.photo?<img src={ca.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:ci}
                  </div>
                  <div style={{ flex:1, background:T.bgInput, borderRadius:10, padding:"7px 11px" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:T.text, marginRight:6 }}>{ca.name||"Member"}</span>
                    <span style={{ fontSize:12, color:T.textMid }}>{c.content}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Add comment */}
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()}
              placeholder="Add a comment…"
              style={{ flex:1, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:20, padding:"8px 14px", color:T.text, fontSize:12, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
              onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}
            />
            <button onClick={addComment} disabled={posting||!commentText.trim()}
              style={{ background:commentText.trim()?"linear-gradient(135deg,#f97316,#ea6008)":T.bgInput, border:"none", borderRadius:20, padding:"8px 16px", color:commentText.trim()?"#fff":T.textLow, fontSize:12, fontWeight:700, cursor:commentText.trim()?"pointer":"default", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {posting?"…":"Post"}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div onClick={()=>setConfirmDel(false)} style={{ position:"fixed", inset:0, background:"#000d", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"24px", maxWidth:300, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <div style={{ fontWeight:800, fontSize:16, color:T.text, marginBottom:8 }}>Delete Post?</div>
            <div style={{ fontSize:13, color:T.textMid, marginBottom:20 }}>This cannot be undone.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setConfirmDel(false)} style={{ flex:1, background:"transparent", border:`1px solid ${T.border}`, borderRadius:9, padding:"10px", color:T.textMid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancel</button>
              <button onClick={deletePost} style={{ flex:1, background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px", color:T.error, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Post Grid Item ── */
function GridItem({ post, onClick }) {
  return (
    <div onClick={()=>onClick(post)} style={{ aspectRatio:"1", overflow:"hidden", position:"relative", background:T.bgInput, cursor:"pointer" }}>
      {post.media_type==="video"&&post.media_url ? (
        <video src={post.media_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} muted playsInline/>
      ) : post.media_url ? (
        <img src={post.media_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
      ) : (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:T.bgHover, padding:8 }}>
          <p style={{ fontSize:11, color:T.textMid, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical" }}>{post.caption}</p>
        </div>
      )}
      {post.media_type==="video" && <div style={{ position:"absolute", top:6, right:6, fontSize:12 }}>▶️</div>}
    </div>
  );
}

/* ── Post Detail Modal ── */
function PostDetailModal({ post, session, onClose, onDeleted }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#000e", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bg, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", animation:"slideUp .3s ease" }}>
        <div style={{ padding:"12px 0 0", display:"flex", justifyContent:"center" }}>
          <div style={{ width:40, height:4, background:T.border, borderRadius:4 }}/>
        </div>
        <div style={{ padding:"8px 0 40px" }}>
          <PostCard post={post} session={session} onDeleted={(id)=>{onDeleted(id);onClose();}}/>
        </div>
      </div>
    </div>
  );
}

/* ── Main ProfilePage ── */
export default function ProfilePage({ session, profile, onEdit, onSaveProfile }) {
  const [posts, setPosts]       = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [view, setView]         = useState("feed"); // "feed" | "grid"
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const fetchPosts = async () => {
    setPostsLoading(true);
    const { data } = await supabase.from("posts").select("*, profiles(name, photo)")
      .eq("user_id", session.userId).order("created_at", { ascending: false });
    setPosts(data || []);
    setPostsLoading(false);

    // Get total likes and comments
    if (data?.length) {
      const ids = data.map(p => p.id);
      const [{ count: lc }, { count: cc }] = await Promise.all([
        supabase.from("post_likes").select("*",{count:"exact",head:true}).in("post_id", ids),
        supabase.from("post_comments").select("*",{count:"exact",head:true}).in("post_id", ids),
      ]);
      setLikeCount(lc || 0);
      setCommentCount(cc || 0);
    }
  };

  useEffect(() => { fetchPosts(); }, [session.userId]);

  const handleDeleted = (id) => setPosts(prev => prev.filter(p => p.id !== id));

  const initials = (profile.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:T.bg }}>

      {/* Top bar */}
      <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bgCard, borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ fontWeight:800, fontSize:18, color:T.text, letterSpacing:"-.02em" }}>
          {profile.username ? `@${profile.username}` : profile.name || "My Profile"}
        </div>
        <button onClick={()=>setShowCreate(true)}
          style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"8px 16px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 14px #f9731440" }}>
          <span style={{ fontSize:16 }}>+</span> New Post
        </button>
      </div>

      {/* Profile header */}
      <div style={{ padding:"20px 16px 0", background:T.bgCard, borderBottom:`1px solid ${T.border}` }}>
        {/* Avatar + stats row */}
        <div style={{ display:"flex", alignItems:"center", gap:24, marginBottom:16 }}>
          {/* Avatar */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#ea6008)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, color:"#fff", overflow:"hidden", border:`3px solid ${T.bgCard}`, boxShadow:`0 0 0 2px ${T.orange}` }}>
              {profile.photo ? <img src={profile.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : initials}
            </div>
          </div>

          {/* Stats */}
          <div style={{ flex:1, display:"flex", gap:0 }}>
            {[
              [posts.length,    "Posts"],
              [likeCount,       "Likes"],
              [commentCount,    "Comments"],
            ].map(([v,l],i) => (
              <div key={l} style={{ flex:1, textAlign:"center", borderRight:i<2?`1px solid ${T.border}`:"none" }}>
                <div style={{ fontWeight:800, fontSize:20, color:T.text }}>{v}</div>
                <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Name + bio */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:16, color:T.text }}>{profile.name || "Your Name"}</div>
          {profile.designation && <div style={{ fontSize:13, color:T.orange, fontWeight:600, marginTop:2 }}>{profile.designation}</div>}
          {profile.company && <div style={{ fontSize:12, color:T.textMid, marginTop:1 }}>{profile.company}</div>}
          {profile.location && <div style={{ fontSize:12, color:T.textLow, marginTop:3 }}>📍 {profile.location}</div>}
          {profile.bio && <div style={{ fontSize:13, color:T.textMid, lineHeight:1.6, marginTop:6 }}>{profile.bio}</div>}
          {profile.website && (
            <a href={profile.website.startsWith("http")?profile.website:"https://"+profile.website} target="_blank" rel="noopener noreferrer"
              style={{ fontSize:13, color:T.orange, fontWeight:600, marginTop:4, display:"block" }}>{profile.website}</a>
          )}
        </div>

        {/* Social links */}
        {(profile.instagram||profile.linkedin||profile.twitter||profile.youtube) && (
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {[
              [profile.instagram, "📸", "Instagram"],
              [profile.linkedin,  "🔗", "LinkedIn"],
              [profile.twitter,   "🐦", "Twitter"],
              [profile.youtube,   "▶",  "YouTube"],
            ].filter(([url])=>url).map(([url,icon,label])=>(
              <a key={label} href={url.startsWith("http")?url:"https://"+url} target="_blank" rel="noopener noreferrer"
                style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 10px", color:T.textMid, fontSize:11, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:5 }}>
                {icon} {label}
              </a>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          <button onClick={onEdit}
            style={{ flex:1, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px", color:T.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            ✏️ Edit Profile
          </button>
          <button
            onClick={()=>{
              const url=window.location.origin+(profile.username?`/u/${profile.username}`:"");
              if(navigator.share){navigator.share({title:profile.name+" on TezConnect",url});}
              else{navigator.clipboard.writeText(url);}
            }}
            style={{ flex:1, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px", color:T.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            📤 Share Profile
          </button>
  
        </div>

        {/* Feed / Grid toggle */}
        <div style={{ display:"flex", borderBottom:`1px solid ${T.border}` }}>
          {[["feed","☰ Feed"],["grid","⊞ Grid"]].map(([id,label])=>(
            <button key={id} onClick={()=>setView(id)}
              style={{ flex:1, background:"none", border:"none", borderBottom:`2px solid ${view===id?T.orange:"transparent"}`, color:view===id?T.orange:T.textLow, fontWeight:700, fontSize:13, padding:"10px 0", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {postsLoading && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 0", gap:12 }}>
          <div style={{ width:20, height:20, border:"2px solid #f9731633", borderTopColor:"#f97316", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
          <span style={{ color:T.textMid, fontSize:13 }}>Loading posts…</span>
        </div>
      )}

      {/* Empty state */}
      {!postsLoading && posts.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>📸</div>
          <div style={{ fontWeight:800, fontSize:20, color:T.text, marginBottom:8 }}>Share your first post</div>
          <div style={{ fontSize:13, color:T.textMid, marginBottom:24, lineHeight:1.7 }}>Share photos, videos, and updates with the TezConnect community</div>
          <button onClick={()=>setShowCreate(true)}
            style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"12px 28px", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 20px #f9731440" }}>
            + Create First Post
          </button>
        </div>
      )}

      {/* Feed view */}
      {!postsLoading && posts.length>0 && view==="feed" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16, paddingBottom:80 }}>
          {posts.map(post=>(
            <PostCard key={post.id} post={post} session={session} onDeleted={handleDeleted}/>
          ))}
        </div>
      )}

      {/* Grid view */}
      {!postsLoading && posts.length>0 && view==="grid" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:3, paddingBottom:80 }}>
          {posts.map(post=>(
            <GridItem key={post.id} post={post} onClick={setSelectedPost}/>
          ))}
        </div>
      )}

      {/* Create post modal */}
      {showCreate && (
        <CreatePostModal session={session} onClose={()=>setShowCreate(false)} onCreated={fetchPosts}/>
      )}

      {/* Post detail modal (from grid tap) */}
      {selectedPost && (
        <PostDetailModal post={selectedPost} session={session} onClose={()=>setSelectedPost(null)} onDeleted={handleDeleted}/>
      )}
    </div>
  );
}
