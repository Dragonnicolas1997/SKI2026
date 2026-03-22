import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { getGalerie, toggleLike, toggleFreeLike } from "../api";
import type { GalleryPhoto } from "../types";

interface Props {
  playerId: number;
}

export default function GalleryScreen({ playerId }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPhotos(await getGalerie(playerId));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [playerId]);

  const handleLike = async (photo: GalleryPhoto) => {
    try {
      if (photo.photo_type === "free") {
        await toggleFreeLike(playerId, photo.completion_id);
      } else {
        await toggleLike(playerId, photo.completion_id);
      }
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                liked_by_me: !p.liked_by_me,
                likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (iso: string) => {
    const now = new Date();
    const date = new Date(iso);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH}h`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const getCaption = (p: GalleryPhoto) => {
    if (p.photo_type === "defi" && p.challenge_text) {
      return (<>a complété : {p.challenge_text}</>);
    }
    if (p.caption) {
      return (<>{p.caption}</>);
    }
    return (<>a partagé une photo 📸</>);
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      <div className="px-6 pt-12 pb-6 bg-white border-b border-slate-100">
        <h2 className="text-xl font-bold text-brand-text">Fil des photos 📸</h2>
        <p className="text-sm text-brand-gray">{photos.length} photo{photos.length > 1 ? "s" : ""} partagée{photos.length > 1 ? "s" : ""}</p>
      </div>

      <div className="p-4 space-y-4">
        {photos.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Author header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {p.player_pseudo.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-brand-text">{p.player_pseudo}</p>
                  {p.photo_type === "defi" && (
                    <span className="text-[9px] bg-brand-primary/10 text-brand-primary font-bold px-1.5 py-0.5 rounded-full">DÉFI</span>
                  )}
                </div>
                <p className="text-[11px] text-brand-gray">{formatTime(p.created_at)}</p>
              </div>
            </div>

            {/* Photo */}
            <img
              src={p.photo_url}
              alt={p.challenge_text || p.caption || "Photo"}
              className="w-full object-cover max-h-[500px]"
              loading="lazy"
            />

            {/* Footer */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
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
                    {p.likes_count}
                  </span>
                </button>
              </div>
              <p className="text-xs text-brand-gray">
                <span className="font-semibold text-brand-text">{p.player_pseudo}</span>{" "}
                {getCaption(p)}
              </p>
            </div>
          </div>
        ))}

        {photos.length === 0 && (
          <div className="text-center text-brand-gray py-12">
            Aucune photo pour le moment.
            <br />
            Complète des défis avec des photos ! 📸
          </div>
        )}
      </div>
    </div>
  );
}
