import os
import io
import csv
import random
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import Player, Completion, Like, FreePhoto, FreePhotoLike
from grilles import GRILLES

load_dotenv()

GAME_PASSWORD = os.getenv("GAME_PASSWORD", "SKI2025")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin2025")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bingo Ski AI Builders")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def check_bingo(completed_indices: list[int]) -> tuple[bool, list[list[int]]]:
    lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # cols
        [0, 4, 8], [2, 4, 6],              # diags
    ]
    s = set(completed_indices)
    bingo_lines = [line for line in lines if all(i in s for i in line)]
    return len(bingo_lines) > 0, bingo_lines


def compress_image(file_bytes: bytes, max_size: int = 1200) -> bytes:
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    output = io.BytesIO()
    img.save(output, format="JPEG", quality=85)
    return output.getvalue()


def verify_admin(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Accès refusé")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PasswordCheck(BaseModel):
    password: str


class JoinRequest(BaseModel):
    pseudo: str
    password: str


class LikeRequest(BaseModel):
    player_id: int
    completion_id: int


class AdminAuth(BaseModel):
    password: str


# ---------------------------------------------------------------------------
# Endpoints — Game
# ---------------------------------------------------------------------------

@app.post("/api/verify-password")
async def verify_password(req: PasswordCheck):
    if req.password != GAME_PASSWORD:
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")
    return {"status": "ok"}


@app.post("/api/join")
async def join(req: JoinRequest, db: Session = Depends(get_db)):
    if req.password != GAME_PASSWORD:
        raise HTTPException(status_code=400, detail="Mot de passe incorrect")

    pseudo = req.pseudo.strip()
    if not pseudo:
        raise HTTPException(status_code=400, detail="Le pseudo ne peut pas être vide")

    player = db.query(Player).filter(Player.pseudo == pseudo).first()
    if player:
        return {"player_id": player.id, "pseudo": player.pseudo, "grid_index": player.grid_index}

    grid_index = random.randint(0, 14)
    player = Player(pseudo=pseudo, grid_index=grid_index)
    db.add(player)
    db.commit()
    db.refresh(player)
    return {"player_id": player.id, "pseudo": player.pseudo, "grid_index": player.grid_index}


@app.get("/api/grille/{player_id}")
async def get_grille(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Joueur non trouvé")

    grille = GRILLES[player.grid_index]
    completions = db.query(Completion).filter(Completion.player_id == player_id).all()
    completed_indices = [c.defi_index for c in completions]
    has_bingo, bingo_lines = check_bingo(completed_indices)

    challenges = []
    for i, text in enumerate(grille):
        comp = next((c for c in completions if c.defi_index == i), None)
        challenge: dict = {"index": i, "text": text, "completed": comp is not None}
        if comp:
            challenge["proof_type"] = comp.proof_type
            if comp.photo_path:
                challenge["photo_url"] = f"/uploads/{comp.photo_path}"
            if comp.proof_text:
                challenge["proof_text"] = comp.proof_text
            challenge["completion_id"] = comp.id
        challenges.append(challenge)

    return {
        "player_id": player.id,
        "pseudo": player.pseudo,
        "grid_index": player.grid_index,
        "challenges": challenges,
        "completed_count": len(completed_indices),
        "has_bingo": has_bingo,
        "bingo_lines": bingo_lines,
    }


@app.post("/api/defi/complete")
async def complete_defi(
    player_id: int = Form(...),
    defi_index: int = Form(...),
    proof_type: str = Form(...),
    proof_text: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Joueur non trouvé")

    if defi_index < 0 or defi_index > 8:
        raise HTTPException(status_code=400, detail="Index de défi invalide")

    existing = db.query(Completion).filter(
        Completion.player_id == player_id,
        Completion.defi_index == defi_index,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Défi déjà complété")

    photo_path = None
    if proof_type == "photo" and file:
        file_bytes = await file.read()
        compressed = compress_image(file_bytes)
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(compressed)
        photo_path = filename
    elif proof_type == "text" and not proof_text:
        raise HTTPException(status_code=400, detail="Le texte de preuve est requis")

    completion = Completion(
        player_id=player_id,
        defi_index=defi_index,
        proof_type=proof_type,
        proof_text=proof_text,
        photo_path=photo_path,
    )
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return {"status": "ok", "completion_id": completion.id}


@app.delete("/api/defi/{completion_id}")
async def delete_defi(completion_id: int, player_id: int, db: Session = Depends(get_db)):
    comp = db.query(Completion).filter(Completion.id == completion_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complétion non trouvée")
    if comp.player_id != player_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    # Delete associated likes
    db.query(Like).filter(Like.completion_id == completion_id).delete()
    # Delete photo file
    if comp.photo_path:
        filepath = os.path.join(UPLOAD_DIR, comp.photo_path)
        if os.path.exists(filepath):
            os.remove(filepath)
    db.delete(comp)
    db.commit()
    return {"status": "ok"}


@app.get("/api/classement")
async def get_classement(db: Session = Depends(get_db)):
    players = db.query(Player).all()
    result = []
    for player in players:
        completions = db.query(Completion).filter(Completion.player_id == player.id).all()
        completed_indices = [c.defi_index for c in completions]
        has_bingo, _ = check_bingo(completed_indices)
        result.append({
            "player_id": player.id,
            "pseudo": player.pseudo,
            "score": len(completed_indices),
            "has_bingo": has_bingo,
        })
    result.sort(key=lambda x: (x["score"], x["has_bingo"]), reverse=True)
    return result


@app.get("/api/galerie")
async def get_galerie(player_id: int = None, db: Session = Depends(get_db)):
    result = []

    # Bingo challenge photos
    completions = (
        db.query(Completion)
        .filter(Completion.photo_path != None)  # noqa: E711
        .order_by(Completion.created_at.desc())
        .all()
    )
    for comp in completions:
        player = db.query(Player).filter(Player.id == comp.player_id).first()
        if not player:
            continue
        grille = GRILLES[player.grid_index]
        likes_count = db.query(Like).filter(Like.completion_id == comp.id).count()
        liked_by_me = False
        if player_id:
            liked_by_me = (
                db.query(Like)
                .filter(Like.player_id == player_id, Like.completion_id == comp.id)
                .first()
                is not None
            )
        result.append({
            "id": f"defi_{comp.id}",
            "photo_type": "defi",
            "completion_id": comp.id,
            "player_id": comp.player_id,
            "player_pseudo": player.pseudo,
            "challenge_text": grille[comp.defi_index] if comp.defi_index < len(grille) else "?",
            "caption": comp.proof_text if comp.proof_type == "photo" else None,
            "photo_url": f"/uploads/{comp.photo_path}",
            "created_at": comp.created_at.isoformat() if comp.created_at else None,
            "likes_count": likes_count,
            "liked_by_me": liked_by_me,
        })

    # Free photos
    free_photos = db.query(FreePhoto).order_by(FreePhoto.created_at.desc()).all()
    for fp in free_photos:
        player = db.query(Player).filter(Player.id == fp.player_id).first()
        if not player:
            continue
        likes_count = db.query(FreePhotoLike).filter(FreePhotoLike.free_photo_id == fp.id).count()
        liked_by_me = False
        if player_id:
            liked_by_me = (
                db.query(FreePhotoLike)
                .filter(FreePhotoLike.player_id == player_id, FreePhotoLike.free_photo_id == fp.id)
                .first()
                is not None
            )
        result.append({
            "id": f"free_{fp.id}",
            "photo_type": "free",
            "completion_id": fp.id,
            "player_id": fp.player_id,
            "player_pseudo": player.pseudo,
            "challenge_text": None,
            "caption": fp.caption,
            "photo_url": f"/uploads/{fp.photo_path}",
            "created_at": fp.created_at.isoformat() if fp.created_at else None,
            "likes_count": likes_count,
            "liked_by_me": liked_by_me,
        })

    result.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return result


@app.post("/api/photo/upload")
async def upload_free_photo(
    player_id: int = Form(...),
    caption: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Joueur non trouvé")

    file_bytes = await file.read()
    compressed = compress_image(file_bytes)
    filename = f"free_{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(compressed)

    photo = FreePhoto(player_id=player_id, caption=caption, photo_path=filename)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return {"status": "ok", "photo_id": photo.id}


@app.post("/api/like")
async def toggle_like(req: LikeRequest, db: Session = Depends(get_db)):
    existing = db.query(Like).filter(
        Like.player_id == req.player_id,
        Like.completion_id == req.completion_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unliked"}
    like = Like(player_id=req.player_id, completion_id=req.completion_id)
    db.add(like)
    db.commit()
    return {"status": "liked"}


class FreeLikeRequest(BaseModel):
    player_id: int
    free_photo_id: int


@app.post("/api/like-free")
async def toggle_free_like(req: FreeLikeRequest, db: Session = Depends(get_db)):
    existing = db.query(FreePhotoLike).filter(
        FreePhotoLike.player_id == req.player_id,
        FreePhotoLike.free_photo_id == req.free_photo_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unliked"}
    like = FreePhotoLike(player_id=req.player_id, free_photo_id=req.free_photo_id)
    db.add(like)
    db.commit()
    return {"status": "liked"}


# ---------------------------------------------------------------------------
# Endpoints — Admin
# ---------------------------------------------------------------------------

@app.get("/api/admin/data")
async def admin_data(password: str, db: Session = Depends(get_db)):
    verify_admin(password)

    players = db.query(Player).all()
    completions = db.query(Completion).order_by(Completion.created_at.desc()).all()

    players_data = []
    for p in players:
        comps = [c for c in completions if c.player_id == p.id]
        completed_indices = [c.defi_index for c in comps]
        has_bingo, _ = check_bingo(completed_indices)
        players_data.append({
            "id": p.id,
            "pseudo": p.pseudo,
            "grid_index": p.grid_index,
            "score": len(comps),
            "has_bingo": has_bingo,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    completions_data = []
    for c in completions:
        player = next((p for p in players if p.id == c.player_id), None)
        grille = GRILLES[player.grid_index] if player else []
        completions_data.append({
            "id": c.id,
            "player_id": c.player_id,
            "player_pseudo": player.pseudo if player else "?",
            "defi_index": c.defi_index,
            "challenge_text": grille[c.defi_index] if c.defi_index < len(grille) else "?",
            "proof_type": c.proof_type,
            "proof_text": c.proof_text,
            "photo_url": f"/uploads/{c.photo_path}" if c.photo_path else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return {
        "players": players_data,
        "completions": completions_data,
        "stats": {
            "total_players": len(players),
            "total_completions": len(completions),
            "total_photos": sum(1 for c in completions if c.photo_path),
        },
    }


@app.get("/api/admin/export-csv")
async def export_csv(password: str, db: Session = Depends(get_db)):
    verify_admin(password)
    completions = db.query(Completion).order_by(Completion.created_at).all()
    players_map = {p.id: p for p in db.query(Player).all()}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Joueur", "Grille", "Défi", "Texte défi", "Type preuve", "Texte preuve", "Photo", "Date"])

    for c in completions:
        player = players_map.get(c.player_id)
        grille = GRILLES[player.grid_index] if player else []
        writer.writerow([
            player.pseudo if player else "?",
            player.grid_index if player else "?",
            c.defi_index,
            grille[c.defi_index] if c.defi_index < len(grille) else "?",
            c.proof_type,
            c.proof_text or "",
            c.photo_path or "",
            c.created_at.isoformat() if c.created_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=bingo_export.csv"},
    )


@app.post("/api/admin/reset")
async def admin_reset(req: AdminAuth, db: Session = Depends(get_db)):
    verify_admin(req.password)
    db.query(Like).delete()
    db.query(FreePhotoLike).delete()
    db.query(Completion).delete()
    db.query(FreePhoto).delete()
    db.commit()
    return {"status": "ok", "message": "Données réinitialisées (joueurs conservés)"}


@app.post("/api/admin/reset-all")
async def admin_reset_all(req: AdminAuth, db: Session = Depends(get_db)):
    verify_admin(req.password)
    db.query(Like).delete()
    db.query(FreePhotoLike).delete()
    db.query(Completion).delete()
    db.query(FreePhoto).delete()
    db.query(Player).delete()
    db.commit()

    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)
        Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    return {"status": "ok", "message": "Toutes les données ont été supprimées"}


# ---------------------------------------------------------------------------
# Serve uploaded photos
# ---------------------------------------------------------------------------

@app.get("/uploads/{filename:path}")
async def serve_upload(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    return FileResponse(filepath)


# ---------------------------------------------------------------------------
# Serve React build (production)
# ---------------------------------------------------------------------------

static_dir = Path(__file__).parent / "static"
if static_dir.exists():

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(static_dir / "index.html"))
