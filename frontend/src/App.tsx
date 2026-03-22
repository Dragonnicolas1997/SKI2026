import { useState } from "react";
import type { Tab } from "./types";
import BottomNav from "./components/BottomNav";
import LoginScreen from "./components/LoginScreen";
import JoinScreen from "./components/JoinScreen";
import GridScreen from "./components/GridScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";
import GalleryScreen from "./components/GalleryScreen";
import ProfileScreen from "./components/ProfileScreen";
import AdminScreen from "./components/AdminScreen";

export default function App() {
  const [auth, setAuth] = useState(localStorage.getItem("authenticated") === "true");
  const [gamePassword, setGamePassword] = useState(sessionStorage.getItem("game_password") || "");
  const [playerId, setPlayerId] = useState<number | null>(
    localStorage.getItem("player_id") ? parseInt(localStorage.getItem("player_id")!) : null,
  );
  const [pseudo, setPseudo] = useState(localStorage.getItem("pseudo") || "");
  const [activeTab, setActiveTab] = useState<Tab>("grid");

  // Admin route
  if (window.location.pathname === "/admin" || window.location.hash === "#admin") {
    return <AdminScreen />;
  }

  // Step 1: Password gate
  if (!auth) {
    return (
      <LoginScreen
        onAuth={(password) => {
          sessionStorage.setItem("game_password", password);
          setGamePassword(password);
          localStorage.setItem("authenticated", "true");
          setAuth(true);
        }}
      />
    );
  }

  // Step 2: Choose pseudo (skip if already known)
  if (!playerId) {
    const savedPseudo = localStorage.getItem("pseudo") || "";
    return (
      <JoinScreen
        password={gamePassword}
        savedPseudo={savedPseudo}
        onJoin={(id, name) => {
          localStorage.setItem("player_id", id.toString());
          localStorage.setItem("pseudo", name);
          setPlayerId(id);
          setPseudo(name);
        }}
      />
    );
  }

  // Step 3: Main app
  const handleLogout = () => {
    const savedPseudo = localStorage.getItem("pseudo") || "";
    localStorage.clear();
    // Keep pseudo for next login
    if (savedPseudo) localStorage.setItem("pseudo", savedPseudo);
    sessionStorage.clear();
    setAuth(false);
    setPlayerId(null);
    setPseudo("");
    setActiveTab("grid");
  };

  return (
    <div className="pb-20">
      {activeTab === "grid" && <GridScreen playerId={playerId} />}
      {activeTab === "leaderboard" && <LeaderboardScreen playerId={playerId} />}
      {activeTab === "gallery" && <GalleryScreen playerId={playerId} />}
      {activeTab === "profile" && (
        <ProfileScreen playerId={playerId} pseudo={pseudo} onLogout={handleLogout} />
      )}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
