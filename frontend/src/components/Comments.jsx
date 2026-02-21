import { useEffect, useState, useContext } from "react";
import API from "../services/api";
import { AuthContext } from "../context/AuthContextObject";

export default function Comments({ recipeId }) {

  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    API.get(`/comments/${recipeId}`)
      .then(res => setComments(res.data));
  }, [recipeId]);

  async function addComment() {
    const value = text.trim();
    if (!value) return;

    const res = await API.post("/comments", {
      recipeId,
      username: user?.username || "Anonymous",
      text: value
    });

    setComments(prev => [...prev, res.data]);
    setText("");
  }

  return (
    <div className="comments-box">
      <h4>Comments</h4>

      {comments.length === 0 && <p>No comments yet.</p>}

      {comments.map((c) => (
        <div key={c._id || `${c.username}-${c.text}`} className="comment-item">
          <strong>{c.username}</strong>
          <p>{c.text}</p>
        </div>
      ))}

      <textarea
        value={text}
        placeholder="Write a comment..."
        onChange={(e) => setText(e.target.value)}
      />

      <button className="approve-btn" onClick={addComment}>Comment</button>
    </div>
  );
}