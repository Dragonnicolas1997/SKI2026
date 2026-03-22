import { useState } from "react";
import { verifyPassword } from "../api";

interface Props {
  onAuth: (password: string) => void;
}

export default function LoginScreen({ onAuth }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await verifyPassword(password);
      onAuth(password);
    } catch {
      setError("Mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 relative overflow-hidden bg-slate-50">
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm">
        <img
          src="/logo.png"
          alt="AI Builders Ski School 2026"
          className="w-48 h-48 object-contain mb-6 drop-shadow-lg"
        />

        <h1 className="text-2xl font-bold text-brand-text mb-1">BINGO SKI</h1>
        <p className="text-brand-primary font-semibold tracking-wide mb-10">Val d'Isère 2026 ❄️</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="text-left">
            <label className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-2 block">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-lg"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full glass-button text-white font-bold py-4 rounded-xl disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Entrer"}
          </button>
        </form>

        <p className="mt-12 text-xs text-brand-gray">
          © 2026 AI Builders — Data & AI Consulting
        </p>
      </div>
    </div>
  );
}
