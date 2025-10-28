import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Onboarding() {
  const { setUser } = useApp();
  const [name, setName] = useState("");
  const nav = useNavigate();

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setUser({ name: name.trim() });
    nav("/lobby");
  }

  return (
    <main style={{ maxWidth: 480, margin: "48px auto", padding: "0 16px" }}>
      <h1>Welcome</h1>
      <p>Enter your name to start.</p>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="history-btn"
          style={{ flex: 1 }}
        />
        <button type="submit" className="reset-btn">
          Continue
        </button>
      </form>
    </main>
  );
}
