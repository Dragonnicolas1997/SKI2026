import { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle2, ImagePlus, Users, X, Trash2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getGrille, uploadFreePhoto, getClassement, deleteDefi } from "../api";
import type { GrilleData, Challenge } from "../types";
import ValidationModal from "./ValidationModal";

const CARD_COLORS = [
  "card-blue",
  "card-purple",
  "card-pink",
  "card-orange",
  "card-cyan",
  "card-green",
  "card-yellow",
  "card-red",
  "card-indigo",
];

const EMOJI_MAP: [RegExp, string][] = [
  [/télésiège/i, "🚡"],
  [/moto/i, "🏍️"],
  [/shot/i, "🥃"],
  [/hors-piste/i, "🏔️"],
  [/skie.*10 ans|depuis plus/i, "⛷️"],
  [/chute/i, "💥"],
  [/saint barth/i, "🏝️"],
  [/change.*erwan/i, "💱"],
  [/selfie.*équipe|photo.*équipe/i, "🤳"],
  [/selfie.*collègue/i, "🤳"],
  [/tire.?fesse/i, "😤"],
  [/rejoint.*cette année|rejoint.*entreprise/i, "🆕"],
  [/même mois/i, "🎂"],
  [/parle.*3 langues/i, "🗣️"],
  [/ordi.*piste/i, "💻"],
  [/snowboard/i, "🏂"],
  [/luge/i, "🛷"],
  [/discours/i, "🎤"],
  [/animal/i, "🐾"],
  [/call.*client/i, "📞"],
  [/mail.*pro/i, "📧"],
  [/photo.*influenceu/i, "📸"],
  [/karaok/i, "🎶"],
  [/marathon/i, "🏃"],
  [/dansé/i, "💃"],
  [/sticker/i, "🏷️"],
  [/piste noire/i, "⬛"],
  [/sans veste/i, "🧥"],
  [/belgique/i, "🇧🇪"],
  [/flocon/i, "❄️"],
  [/étranger|vécu à l/i, "✈️"],
  [/la poste/i, "📮"],
  [/sncf|train|gare/i, "🚂"],
  [/maif.*martin/i, "🏢"],
  [/rire.*blague|5 personnes/i, "😂"],
  [/fesse/i, "🍑"],
  [/nationalité/i, "🌍"],
  [/3 pays/i, "🌍"],
  [/perdu.*ski/i, "😱"],
  [/déteste.*ski/i, "🙅"],
  [/après.?ski/i, "🍻"],
  [/sommet/i, "🏔️"],
  [/16.*nicolas/i, "🗼"],
  [/emmanuel/i, "📱"],
  [/ski/i, "⛷️"],
];

function getEmoji(text: string): string {
  for (const [pattern, emoji] of EMOJI_MAP) {
    if (pattern.test(text)) return emoji;
  }
  return "🎯";
}

interface Props {
  playerId: number;
}

export default function GridScreen({ playerId }: Props) {
  const [data, setData] = useState<GrilleData | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showBingo, setShowBingo] = useState(false);
  const [prevHadBingo, setPrevHadBingo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [freePhoto, setFreePhoto] = useState<{ file: File; preview: string } | null>(null);
  const [freeCaption, setFreeCaption] = useState("");
  const [completedChallenge, setCompletedChallenge] = useState<Challenge | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pendingReopen = useRef<Challenge | null>(null);
  const freePhotoRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [d, classement] = await Promise.all([
        getGrille(playerId),
        getClassement(),
      ]);
      setData(d);
      setPlayerCount(classement.length);
      if (d.has_bingo && !prevHadBingo) {
        setShowBingo(true);
        setPrevHadBingo(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, [playerId, prevHadBingo]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brand-gray">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      {/* Player count banner */}
      <div className="px-4 pt-12 pb-2 bg-white">
        <div className="flex items-center justify-center gap-2 bg-brand-primary/5 rounded-full py-2 px-4">
          <Users size={14} className="text-brand-primary" />
          <span className="text-xs font-semibold text-brand-primary">
            {playerCount} joueur{playerCount > 1 ? "s" : ""} connecté{playerCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pt-3 pb-6 bg-white border-b border-slate-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h2 className="text-xl font-bold text-brand-text">Mon Bingo</h2>
              <p className="text-sm text-brand-gray">Grille n°{data.grid_index + 1}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-brand-primary">
              {data.completed_count}/9
            </span>
            <p className="text-[10px] font-bold text-brand-gray uppercase tracking-tighter">
              défis
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-3 relative">
        <div className="grid grid-cols-3 gap-2.5">
          {data.challenges.map((c) => (
            <button
              key={c.index}
              onClick={() => c.completed ? setCompletedChallenge(c) : setSelectedChallenge(c)}
              className={`bingo-card shadow-md ${CARD_COLORS[c.index]} ${c.completed ? "completed" : ""}`}
            >
              <img src="/logo.png" alt="" className="card-logo" />
              <span className="card-emoji">{getEmoji(c.text)}</span>
              <span className="card-text">{c.text}</span>
              {c.completed && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={20} className="text-green-600 fill-green-100" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Bingo banner */}
        <AnimatePresence>
          {showBingo && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: -15 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bingo-banner"
              onClick={() => setShowBingo(false)}
            >
              🎉 BINGO ! 🎉
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Free photo button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => freePhotoRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-brand-light rounded-xl text-brand-primary font-semibold active:scale-[0.98] transition-all"
        >
          <ImagePlus size={20} />
          Partager une photo souvenir 📸
        </button>
        <input
          ref={freePhotoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFreePhoto({ file: f, preview: URL.createObjectURL(f) });
              setFreeCaption("");
            }
            e.target.value = "";
          }}
        />
      </div>

      {/* Free photo preview modal */}
      {freePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setFreePhoto(null)}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md my-auto sm:my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-brand-text">Partager une photo</h3>
              <button onClick={() => setFreePhoto(null)} className="p-2 text-brand-gray hover:text-brand-text">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <img src={freePhoto.preview} alt="Preview" className="w-full rounded-xl max-h-64 object-cover" />

              <input
                type="text"
                value={freeCaption}
                onChange={(e) => setFreeCaption(e.target.value)}
                placeholder="Ajoute une légende... (optionnel)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setFreePhoto(null)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-brand-gray"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    setUploading(true);
                    try {
                      await uploadFreePhoto(playerId, freePhoto.file, freeCaption.trim() || undefined);
                      setFreePhoto(null);
                      setFreeCaption("");
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                  className="flex-1 py-3 glass-button text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {uploading ? "Envoi..." : "Publier ✅"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed challenge modal */}
      {completedChallenge && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setCompletedChallenge(null)}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md my-auto sm:my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-brand-text">Défi complété</h3>
              <button onClick={() => setCompletedChallenge(null)} className="p-2 text-brand-gray hover:text-brand-text">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm font-medium text-brand-text text-center">{completedChallenge.text}</p>
              </div>

              {completedChallenge.photo_url && (
                <img src={completedChallenge.photo_url} alt="Preuve" className="w-full rounded-xl max-h-64 object-cover" />
              )}

              {completedChallenge.proof_text && completedChallenge.proof_type === "text" && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-brand-gray italic">"{completedChallenge.proof_text}"</p>
                </div>
              )}

              {completedChallenge.proof_text && completedChallenge.proof_type === "photo" && (
                <p className="text-sm text-brand-gray text-center">{completedChallenge.proof_text}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!completedChallenge.completion_id) return;
                    setDeleting(true);
                    try {
                      await deleteDefi(completedChallenge.completion_id, playerId);
                      setCompletedChallenge(null);
                      fetchData();
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-red-200 bg-red-50 rounded-xl font-medium text-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {deleting ? "..." : "Supprimer"}
                </button>
                <button
                  onClick={async () => {
                    if (!completedChallenge.completion_id) return;
                    pendingReopen.current = { index: completedChallenge.index, text: completedChallenge.text, completed: false } as Challenge;
                    setDeleting(true);
                    try {
                      await deleteDefi(completedChallenge.completion_id, playerId);
                      await fetchData();
                      setCompletedChallenge(null);
                      setDeleting(false);
                      setTimeout(() => {
                        setSelectedChallenge(pendingReopen.current);
                        pendingReopen.current = null;
                      }, 100);
                    } catch (err) {
                      console.error(err);
                      setDeleting(false);
                      pendingReopen.current = null;
                    }
                  }}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 glass-button text-white rounded-xl font-bold disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  {deleting ? "..." : "Modifier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation modal */}
      {selectedChallenge && (
        <ValidationModal
          challenge={selectedChallenge}
          playerId={playerId}
          onClose={() => setSelectedChallenge(null)}
          onSuccess={() => {
            setSelectedChallenge(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
