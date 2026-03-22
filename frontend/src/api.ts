const API = "/api";

async function request(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Erreur serveur");
  }
  return res.json();
}

export function verifyPassword(password: string) {
  return request(`${API}/verify-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function joinGame(pseudo: string, password: string) {
  return request(`${API}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pseudo, password }),
  });
}

export function getGrille(playerId: number) {
  return request(`${API}/grille/${playerId}`);
}

export function completeDefi(
  playerId: number,
  defiIndex: number,
  proofType: string,
  text?: string,
  file?: File,
) {
  const fd = new FormData();
  fd.append("player_id", playerId.toString());
  fd.append("defi_index", defiIndex.toString());
  fd.append("proof_type", proofType);
  if (text) fd.append("proof_text", text);
  if (file) fd.append("file", file);
  return request(`${API}/defi/complete`, { method: "POST", body: fd });
}

export function deleteDefi(completionId: number, playerId: number) {
  return request(`${API}/defi/${completionId}?player_id=${playerId}`, { method: "DELETE" });
}

export function getClassement() {
  return request(`${API}/classement`);
}

export function getGalerie(playerId: number) {
  return request(`${API}/galerie?player_id=${playerId}`);
}

export function uploadFreePhoto(playerId: number, file: File, caption?: string) {
  const fd = new FormData();
  fd.append("player_id", playerId.toString());
  fd.append("file", file);
  if (caption) fd.append("caption", caption);
  return request(`${API}/photo/upload`, { method: "POST", body: fd });
}

export function toggleFreeLike(playerId: number, freePhotoId: number) {
  return request(`${API}/like-free`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: playerId, free_photo_id: freePhotoId }),
  });
}

export function toggleLike(playerId: number, completionId: number) {
  return request(`${API}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player_id: playerId, completion_id: completionId }),
  });
}

export function getAdminData(password: string) {
  return request(`${API}/admin/data?password=${encodeURIComponent(password)}`);
}

export function adminReset(password: string) {
  return request(`${API}/admin/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function adminResetAll(password: string) {
  return request(`${API}/admin/reset-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}
