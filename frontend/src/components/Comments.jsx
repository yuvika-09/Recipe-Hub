import { useEffect, useState } from "react";
import axios from "axios";

export default function Comments({ recipeId }) {

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    axios.get(`http://localhost:5003/comments/${recipeId}`)
      .then(res => setComments(res.data));
  }, [recipeId]);

  async function addComment() {
    await axios.post("http://localhost:5003/comments", {
      recipeId,
      username: "User",
      text
    });

    setComments([...comments, { text }]);
    setText("");
  }

  return (
    <div>
      <h4>Comments</h4>

      {comments.map((c,i)=>(
        <p key={i}>{c.text}</p>
      ))}

      <input
        value={text}
        onChange={(e)=>setText(e.target.value)}
      />

      <button onClick={addComment}>Comment</button>
    </div>
  );
}
