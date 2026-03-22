import { useState, useEffect } from "react";
import { Snowflake } from "lucide-react";
import { joinGame } from "../api";

interface Props {
  password: string;
  savedPseudo?: string;
  onJoin: (playerId: number, pseudo: string) => void;
}

export default function JoinScreen({ password, savedPseudo, onJoin }: Props) {
  const [pseudo, setPseudo] = useState(savedPseudo || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-reconnect if pseudo is already saved
  useEffect(() => {
    if (savedPseudo && password) {
      setLoading(true);
      joinGame(savedPseudo, password)
        .then((data) => onJoin(data.player_id, data.pseudo))
        .catch(() => setLoading(false));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await joinGame(pseudo.trim(), password);
      onJoin(data.player_id, data.pseudo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auto-reconnecting
  if (savedPseudo && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Snowflake className="text-white animate-spin" size={32} />
        </div>
        <p className="text-brand-gray font-medium">Reconnexion en tant que <span className="font-bold text-brand-text">{savedPseudo}</span>...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-8 pt-24 relative overflow-hidden bg-slate-50">
      <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
        <Snowflake size={200} className="text-brand-primary" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center flex-1">
        <img
          src="/logo.png"
          alt="AI Builders Ski School 2026"
          className="w-28 h-28 object-contain mb-6 drop-shadow-lg"
        />

        <h1 className="text-2xl font-bold text-brand-text mb-2">
          {savedPseudo ? `Re-bonjour ! ⛷️` : `Bienvenue ! ⛷️`}
        </h1>
        <p className="text-brand-gray mb-12">
          {savedPseudo ? "Confirme ton pseudo" : "Choisis ton pseudo pour commencer"}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="text-left">
            <label className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-2 block">
              Ton pseudo
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Ex: Julie, Marc..."
              className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-lg"
              autoFocus
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !pseudo.trim()}
            className="w-full glass-button text-white font-bold py-4 rounded-xl disabled:opacity-50"
          >
            {loading ? "Connexion..." : savedPseudo ? "Me reconnecter 🎿" : "C'est parti ! 🎿"}
          </button>
        </form>
      </div>
    </div>
  );
}
