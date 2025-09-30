import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Onboarding() {
  const [name, setName] = useState("");
  const { setName: setAppName } = useApp();
  const nav = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setAppName(name.trim());
    nav("/lobby");
  }

  return (
    <main className="game-info" style={{ marginTop: 48 }}>
      <h2 style={{ marginTop: 0 }}>Welcome</h2>
      <p>Please enter your name to join the lobby.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          className="history-btn"
          style={{ padding: 10 }}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="reset-btn" type="submit">
          Continue
        </button>
      </form>
    </main>
  );
}
