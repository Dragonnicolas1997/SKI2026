import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { getClassement, getGalerie, toggleLike, toggleFreeLike } from "../api";
import type { PlayerScore, GalleryPhoto } from "../types";

interface Props {
  playerId: number;
}

export default function LeaderboardScreen({ playerId }: Props) {
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [topPhotos, setTopPhotos] = useState<GalleryPhoto[]>([]);
  const [tab, setTab] = useState<"ranking" | "photos">("ranking");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersData, photosData] = await Promise.all([
          getClassement(),
          getGalerie(playerId),
        ]);
        setPlayers(playersData);
        // Sort by likes descending
        const sorted = [...photosData].sort((a, b) => b.likes_count - a.likes_count);
        setTopPhotos(sorted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [playerId]);

  const handleLike = async (photo: GalleryPhoto) => {
    try {
      if (photo.photo_type === "free") {
        await toggleFreeLike(playerId, photo.completion_id);
      } else {
        await toggleLike(playerId, photo.completion_id);
      }
      setTopPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                liked_by_me: !p.liked_by_me,
                likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p,
        ).sort((a, b) => b.likes_count - a.likes_count),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getMedal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return null;
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      <div className="px-6 pt-12 pb-6 bg-brand-dark text-white">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h2 className="text-xl font-bold">Classement 🏆</h2>
            <p className="text-sm text-white/60">Top Builders 2026</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-slate-200">
        <button
          onClick={() => setTab("ranking")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "ranking"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-brand-gray"
          }`}
        >
          ⛷️ Joueurs
        </button>
        <button
          onClick={() => setTab("photos")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "photos"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-brand-gray"
          }`}
        >
          ❤️ Photos populaires
        </button>
      </div>

      {/* Ranking tab */}
      {tab === "ranking" && (
        <div className="flex-1 p-4 space-y-3">
          {players.map((p, i) => {
            const isCurrent = p.player_id === playerId;
            const medal = getMedal(i);

            return (
              <div
                key={p.player_id}
                className={`flex items-center gap-4 p-4 rounded-2xl shadow-sm transition-all ${
                  isCurrent ? "bg-brand-primary text-white" : "bg-white"
                }`}
              >
                <div className="w-8 text-center font-bold text-lg shrink-0">
                  {medal || i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{p.pseudo}</span>
                    {p.has_bingo && <span className="text-sm shrink-0">🎉</span>}
                  </div>
                  <div className={`w-full h-3 rounded-full mt-2 overflow-hidden ${isCurrent ? "bg-white/30" : "bg-slate-200"}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrent ? "bg-white" : "bg-brand-primary"
                      }`}
                      style={{ width: `${(p.score / 9) * 100}%` }}
                    />
                  </div>
                </div>
                <div className={`font-bold shrink-0 ${isCurrent ? "text-white" : "text-brand-primary"}`}>
                  {p.score}/9
                </div>
              </div>
            );
          })}

          {players.length === 0 && (
            <div className="text-center text-brand-gray py-12">
              Aucun joueur inscrit pour le moment
            </div>
          )}
        </div>
      )}

      {/* Top photos tab */}
      {tab === "photos" && (
        <div className="flex-1 p-4 space-y-3">
          {topPhotos.map((p, i) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Rank + author */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 text-center font-bold text-lg shrink-0">
                  {getMedal(i) || i + 1}
                </div>
                <div className="w-9 h-9 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {p.player_pseudo.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-brand-text">{p.player_pseudo}</p>
                  <p className="text-[11px] text-brand-gray truncate">
                    {p.challenge_text || p.caption || "Photo souvenir 📸"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Heart size={16} className="text-red-500 fill-red-500" />
                  <span className="font-bold text-sm text-red-500">{p.likes_count}</span>
                </div>
              </div>

              {/* Photo */}
              <img
                src={p.photo_url}
                alt={p.challenge_text || p.caption || "Photo"}
                className="w-full object-cover max-h-[350px]"
                loading="lazy"
              />

              {/* Like button */}
              <div className="px-4 py-3 flex items-center gap-2">
                <button
                  onClick={() => handleLike(p)}
                  className="flex items-center gap-1.5 active:scale-110 transition-transform min-h-[44px]"
                >
                  <Heart
                    size={22}
                    className={
                      p.liked_by_me
                        ? "text-red-500 fill-red-500"
                        : "text-brand-gray"
                    }
                  />
                  <span className={`text-sm font-semibold ${p.liked_by_me ? "text-red-500" : "text-brand-gray"}`}>
                    {p.liked_by_me ? "Aimé" : "Aimer"}
                  </span>
                </button>
              </div>
            </div>
          ))}

          {topPhotos.length === 0 && (
            <div className="text-center text-brand-gray py-12">
              Aucune photo pour le moment 📸
            </div>
          )}
        </div>
      )}
    </div>
  );
}
