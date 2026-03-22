import { LayoutGrid, Trophy, Camera, User } from "lucide-react";
import type { Tab } from "../types";

const tabs: { id: Tab; icon: typeof LayoutGrid; label: string }[] = [
  { id: "grid", icon: LayoutGrid, label: "Grille" },
  { id: "leaderboard", icon: Trophy, label: "Classement" },
  { id: "gallery", icon: Camera, label: "Photos" },
  { id: "profile", icon: User, label: "Profil" },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-950 px-4 py-3 flex justify-around items-center z-50 safe-area-pb">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-col items-center gap-1 min-w-[48px] min-h-[48px] justify-center transition-colors ${
            active === id ? "text-brand-cyan" : "text-white/60"
          }`}
        >
          <Icon size={22} />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
