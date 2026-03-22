import { useState } from "react";
import { Lock, Download, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { getAdminData, adminReset, adminResetAll } from "../api";

export default function AdminScreen() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"submissions" | "players" | "photos">("submissions");

  const login = async () => {
    try {
      const d = await getAdminData(password);
      setData(d);
      setAuthenticated(true);
      setError("");
    } catch {
      setError("Mot de passe incorrect");
    }
  };

  const refresh = async () => {
    try {
      setData(await getAdminData(password));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    if (!confirm("Réinitialiser les données ? (les joueurs seront conservés)")) return;
    await adminReset(password);
    refresh();
  };

  const handleResetAll = async () => {
    if (!confirm("SUPPRIMER TOUTES LES DONNÉES ? Cette action est irréversible !")) return;
    await adminResetAll(password);
    refresh();
  };

  const handleExport = () => {
    window.open(`/api/admin/export-csv?password=${encodeURIComponent(password)}`);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-xl font-bold text-brand-text">Admin Bingo</h1>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Mot de passe admin"
            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button onClick={login} className="w-full glass-button text-white font-bold py-4 rounded-xl">
            Connexion
          </button>

          <a href="/" className="block text-center text-sm text-brand-gray mt-6 hover:underline">
            Retour au jeu
          </a>
        </div>
      </div>
    );
  }

  const stats = (data as Record<string, unknown>)?.stats as Record<string, number> | undefined;
  const completions = ((data as Record<string, unknown>)?.completions ?? []) as Record<string, unknown>[];
  const players = ((data as Record<string, unknown>)?.players ?? []) as Record<string, unknown>[];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-brand-dark text-white px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin Bingo Ski 2025</h1>
            <div className="flex gap-4 mt-2 text-sm text-white/60">
              <span>{stats?.total_players ?? 0} joueurs</span>
              <span>{stats?.total_completions ?? 0} soumissions</span>
              <span>{stats?.total_photos ?? 0} photos</span>
            </div>
          </div>
          <button onClick={refresh} className="p-2 text-white/60 hover:text-white">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        {(["submissions", "players", "photos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-gray"
            }`}
          >
            {t === "submissions" ? "Soumissions" : t === "players" ? "Joueurs" : "Photos"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Action buttons */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm font-medium text-orange-600"
          >
            <Trash2 size={16} /> Reset données
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600"
          >
            <AlertTriangle size={16} /> Reset complet
          </button>
        </div>

        {tab === "submissions" && (
          <div className="bg-white rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-3 text-brand-gray font-medium">Joueur</th>
                  <th className="text-left p-3 text-brand-gray font-medium">Défi</th>
                  <th className="text-left p-3 text-brand-gray font-medium">Type</th>
                  <th className="text-left p-3 text-brand-gray font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {completions.map((c) => (
                  <tr key={c.id as number} className="border-b border-slate-50">
                    <td className="p-3 font-medium">{c.player_pseudo as string}</td>
                    <td className="p-3 text-brand-gray max-w-[200px] truncate">
                      {c.challenge_text as string}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          c.proof_type === "photo"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {c.proof_type === "photo" ? "📸 Photo" : "✍️ Texte"}
                      </span>
                    </td>
                    <td className="p-3 text-brand-gray text-xs">
                      {c.created_at
                        ? new Date(c.created_at as string).toLocaleString("fr-FR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {completions.length === 0 && (
              <p className="text-center text-brand-gray py-8">Aucune soumission</p>
            )}
          </div>
        )}

        {tab === "players" && (
          <div className="space-y-3">
            {players.map((p) => (
              <div
                key={p.id as number}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold">
                  {(p.pseudo as string).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-brand-text">{p.pseudo as string}</p>
                  <p className="text-xs text-brand-gray">
                    Grille n°{(p.grid_index as number) + 1} · {p.score as number}/9 défis{" "}
                    {p.has_bingo ? "🎉 BINGO" : ""}
                  </p>
                </div>
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-center text-brand-gray py-8">Aucun joueur</p>
            )}
          </div>
        )}

        {tab === "photos" && (
          <div className="columns-2 gap-3 space-y-3">
            {completions
              .filter((c) => c.photo_url)
              .map((c) => (
                <div key={c.id as number} className="break-inside-avoid">
                  <img
                    src={c.photo_url as string}
                    alt=""
                    className="w-full rounded-xl"
                    loading="lazy"
                  />
                  <p className="text-xs text-brand-gray mt-1">
                    {c.player_pseudo as string} — {c.challenge_text as string}
                  </p>
                </div>
              ))}
            {completions.filter((c) => c.photo_url).length === 0 && (
              <p className="text-center text-brand-gray py-8 col-span-2">Aucune photo</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
