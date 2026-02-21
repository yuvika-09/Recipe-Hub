import { useEffect, useState, useContext, useMemo, useCallback } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

export default function Comments({ recipeId }) {

  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const loadComments = useCallback(async () => {
    const res = await API.get(`/comments/${recipeId}`);
    setComments(res.data);
  }, [recipeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadComments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadComments]);

  const grouped = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId);
    const repliesByParent = comments
      .filter((c) => c.parentId)
      .reduce((acc, c) => {
        const key = String(c.parentId);
        if (!acc[key]) acc[key] = [];
        acc[key].push(c);
        return acc;
      }, {});

    return { roots, repliesByParent };
  }, [comments]);

  async function addComment() {
    const value = text.trim();
    if (!value || !user) return;

    try {
      const res = await API.post("/comments", {
        recipeId,
        username: user.username,
        text: value,
        parentId: null
      });

      setComments(prev => [...prev, res.data]);
      setText("");
      loadComments();
    } catch (err) {
      alert(err?.response?.data || "Failed to add comment");
    }
  }

  async function addReply(parentId) {
    const value = replyText.trim();
    if (!value || !user) return;

    try {
      const res = await API.post("/comments", {
        recipeId,
        username: user.username,
        text: value,
        parentId
      });

      setComments(prev => [...prev, res.data]);
      setReplyText("");
      setReplyTo(null);
      loadComments();
    } catch (err) {
      alert(err?.response?.data || "Failed to add reply");
    }
  }

  return (
    <div className="comments-box">
      <h4>Comments</h4>

      {grouped.roots.length === 0 && <p>No comments yet.</p>}

      {grouped.roots.map((c) => (
        <div key={c._id || `${c.username}-${c.text}`} className="comment-item">
          <strong>{c.username}</strong>
          <p>{c.text}</p>

          <button className="rate-btn" onClick={() => setReplyTo(c._id)}>
            Reply
          </button>

          {replyTo === c._id && (
            <div className="reply-box">
              <textarea
                value={replyText}
                placeholder="Write a reply..."
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button className="approve-btn" onClick={() => addReply(c._id)}>
                Post Reply
              </button>
            </div>
          )}

          <div className="reply-list">
            {(grouped.repliesByParent[String(c._id)] || []).map((r) => (
              <div key={r._id} className="reply-item">
                <strong>{r.username}</strong>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <textarea
        value={text}
        placeholder={user ? "Write a comment..." : "Login to comment"}
        onChange={(e) => setText(e.target.value)}
        disabled={!user}
      />

      <button className="approve-btn" onClick={addComment} disabled={!user}>
        Comment
      </button>
    </div>
  );
}