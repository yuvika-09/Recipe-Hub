import { useEffect, useState, useContext, useMemo, useCallback } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";
import { displayUsername } from "../utils/UserDisplay";

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

  const commentsByParent = useMemo(() => comments.reduce((acc, comment) => {
    const key = comment.parentId ? String(comment.parentId) : "root";
    if (!acc[key]) acc[key] = [];
    acc[key].push(comment);
    return acc;
  }, {}), [comments]);

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

  function openReply(comment) {
    setReplyTo(comment._id);
    setReplyText(`@${displayUsername(comment.username)} `);
  }

  function renderCommentThread(parentKey = "root", level = 0) {
    const list = commentsByParent[parentKey] || [];

    return list.map((comment) => (
      <div
        key={comment._id || `${comment.username}-${comment.text}-${comment.createdAt}`}
        className={level === 0 ? "comment-item" : "reply-item"}
      >
        <strong>{displayUsername(comment.username)}</strong>
        <p>{comment.text}</p>

        <button className="rate-btn" onClick={() => openReply(comment)} disabled={!user}>
          Reply
        </button>

        {replyTo === comment._id && (
          <div className="reply-box">
            <textarea
              value={replyText}
              placeholder="Write a reply..."
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button className="approve-btn" onClick={() => addReply(comment._id)}>
              Post Reply
            </button>
          </div>
        )}

        <div className="reply-list">
          {renderCommentThread(String(comment._id), level + 1)}
        </div>
      </div>
    ));
  }

  return (
    <div className="comments-box">
      <h4>Comments</h4>

      {(commentsByParent.root || []).length === 0 && <p>No comments yet.</p>}

      {renderCommentThread()}

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