import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { getGrille } from "../api";
import type { GrilleData } from "../types";

interface Props {
  playerId: number;
  pseudo: string;
  onLogout: () => void;
}

export default function ProfileScreen({ playerId, pseudo, onLogout }: Props) {
  const [data, setData] = useState<GrilleData | null>(null);

  useEffect(() => {
    getGrille(playerId).then(setData).catch(console.error);
  }, [playerId]);

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      <div className="px-6 pt-12 pb-8 bg-brand-dark text-white text-center">
        <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold">{pseudo.charAt(0).toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-bold">{pseudo}</h2>
        <p className="text-white/60 text-sm">Joueur Bingo Ski 2025 ⛷️</p>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">
            Progression
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-primary">
                {data?.completed_count ?? 0}
              </p>
              <p className="text-[10px] text-brand-gray font-medium">/ 9 défis</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${((data?.completed_count ?? 0) / 9) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">
            Infos
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-brand-gray">Grille</span>
              <span className="text-sm font-bold text-brand-text">
                n°{(data?.grid_index ?? 0) + 1}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-gray">Bingo</span>
              <span className="text-sm font-bold">
                {data?.has_bingo ? "✅ Oui !" : "❌ Pas encore"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 border border-red-200 text-red-500 rounded-2xl font-medium hover:bg-red-50 transition-colors min-h-[48px]"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
