import { useState, useRef } from "react";
import { X, Camera, Upload, PenLine } from "lucide-react";
import { completeDefi } from "../api";
import type { Challenge } from "../types";

interface Props {
  challenge: Challenge;
  playerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ValidationModal({ challenge, playerId, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"choose" | "photo" | "text">("choose");
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setMode("photo");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "photo" && file) {
        await completeDefi(playerId, challenge.index, "photo", caption.trim() || undefined, file);
      } else if (mode === "text" && text.trim()) {
        await completeDefi(playerId, challenge.index, "text", text.trim());
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md my-auto sm:my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-brand-text">Valider ce défi</h3>
          <button onClick={onClose} className="p-2 text-brand-gray hover:text-brand-text">
            <X size={20} />
          </button>
        </div>

        {/* Challenge text */}
        <div className="p-4 bg-brand-primary/5 mx-4 mt-4 rounded-xl">
          <p className="text-sm font-medium text-brand-text text-center">{challenge.text}</p>
        </div>

        {/* Choose mode */}
        {mode === "choose" && (
          <div className="p-4 space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-light active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Upload size={24} className="text-brand-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-brand-text">Uploader une photo</p>
                <p className="text-xs text-brand-gray">Depuis ta galerie</p>
              </div>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-light active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-brand-cyan/10 rounded-xl flex items-center justify-center shrink-0">
                <Camera size={24} className="text-brand-cyan" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-brand-text">Prendre une photo</p>
                <p className="text-xs text-brand-gray">Ouvrir l'appareil photo</p>
              </div>
            </button>

            <button
              onClick={() => setMode("text")}
              className="w-full flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-light active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <PenLine size={24} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-brand-text">Écrire un texte</p>
                <p className="text-xs text-brand-gray">Décris ta preuve</p>
              </div>
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Photo preview + caption */}
        {mode === "photo" && preview && (
          <div className="p-4 space-y-3">
            <img src={preview} alt="Preview" className="w-full rounded-xl max-h-64 object-cover" />

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ajoute une légende... (optionnel)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm"
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMode("choose");
                  setFile(null);
                  setPreview(null);
                  setCaption("");
                }}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-brand-gray"
              >
                Changer
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 glass-button text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "..." : "Valider ✅"}
              </button>
            </div>
          </div>
        )}

        {/* Text input */}
        {mode === "text" && (
          <div className="p-4 space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Décris comment tu as accompli ce défi..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              autoFocus
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setMode("choose")}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-medium text-brand-gray"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                className="flex-1 py-3 glass-button text-white rounded-xl font-bold disabled:opacity-50"
              >
                {loading ? "..." : "Valider ✅"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
