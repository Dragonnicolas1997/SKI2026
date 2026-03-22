# Bingo Ski 2025 — AI Builders

Bingo interactif pour le séminaire ski AI Builders. App mobile-first avec galerie photos, classement temps réel et défis fun.

## Structure

```
Bingo/
├── backend/            # FastAPI + SQLite
│   ├── main.py         # API endpoints
│   ├── models.py       # SQLAlchemy models
│   ├── database.py     # DB setup
│   ├── grilles.py      # 15 grilles de bingo
│   └── uploads/        # Photos (créé automatiquement)
├── frontend/           # React + Vite + TailwindCSS
│   └── src/
│       ├── App.tsx
│       ├── api.ts      # Appels API
│       └── components/ # Écrans de l'app
└── README.md
```

## Installation & Lancement (développement)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Le backend tourne sur http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend tourne sur http://localhost:5173

## Variables d'environnement

Créer un fichier `backend/.env` :

```
GAME_PASSWORD=SKI2025
ADMIN_PASSWORD=admin2025
```

## Accès

- **Joueurs** : ouvrir l'app, entrer le mot de passe partagé (défaut: `SKI2025`), puis choisir un pseudo
- **Admin** : aller sur `/admin` et entrer le mot de passe admin (défaut: `admin2025`)

## Déploiement sur Render

1. Build le frontend :
   ```bash
   cd frontend && npm run build
   ```

2. Copier le build dans le backend :
   ```bash
   cp -r dist ../backend/static
   ```

3. Sur Render, créer un **Web Service** :
   - Root directory : `backend`
   - Build command : `pip install -r requirements.txt`
   - Start command : `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Ajouter un **disque persistant** monté sur `/opt/render/project/src/uploads`
   - Variables d'environnement : `GAME_PASSWORD`, `ADMIN_PASSWORD`, `UPLOAD_DIR=/opt/render/project/src/uploads`

## Fonctionnalités

- Grille de bingo 3x3 avec 9 défis par joueur (15 grilles différentes)
- Validation par photo (upload ou camera) ou texte libre
- Détection automatique du BINGO (ligne, colonne, diagonale)
- Classement temps réel avec polling (10s)
- Galerie photos partagée avec likes
- Compression automatique des photos (max 1200px)
- Panel admin avec export CSV et reset
