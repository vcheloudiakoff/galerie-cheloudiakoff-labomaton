# Galerie Cheloudiakoff x Labomaton

Site vitrine pour la Galerie Cheloudiakoff avec section Labomaton (service d'impression photo a venir).

## Stack Technique

### Backend
- **Rust** + **Axum** (API REST)
- **SQLx** + **PostgreSQL** (Base de donnees)
- **JWT** (Authentification)
- **S3/MinIO** (Stockage images)

### Frontend
- **React** + **TypeScript**
- **Vite** (Build tool)
- **TailwindCSS** + **shadcn/ui** (Styling)
- **React Router** (Routing)

## Prerequis

- Docker & Docker Compose
- Rust 1.75+ (pour le developpement backend)
- Node.js 20+ (pour le developpement frontend)

## Installation

### 1. Cloner le projet

```bash
git clone <repo-url>
cd galerie-cheloudiakoff-labomaton
```

### 2. Demarrer les services Docker

```bash
docker compose up -d
```

Cela demarre :
- PostgreSQL sur le port `5432`
- MinIO sur les ports `9000` (API) et `9001` (Console)

### 3. Configurer le backend

```bash
cd backend
cp .env.example .env
# Editer .env si necessaire
```

### 4. Lancer le backend

```bash
cd backend
cargo run
```

Le serveur demarre sur `http://localhost:3000`

Au premier demarrage :
- Les migrations SQL sont executees automatiquement
- Un compte admin est cree avec les identifiants de `.env`

### 5. Configurer le frontend

```bash
cd frontend
cp .env.example .env
npm install
```

### 6. Lancer le frontend

```bash
cd frontend
npm run dev
```

Le frontend demarre sur `http://localhost:5173`

## Acces

### Site public
- `http://localhost:5173` - Page d'accueil
- `http://localhost:5173/galerie` - La galerie
- `http://localhost:5173/artistes` - Liste des artistes
- `http://localhost:5173/evenements` - Evenements
- `http://localhost:5173/actualites` - Actualites
- `http://localhost:5173/contact` - Contact
- `http://localhost:5173/labomaton` - Page Labomaton + Waitlist

### Administration
- `http://localhost:5173/admin/login` - Connexion
- `http://localhost:5173/admin` - Dashboard

### Services
- `http://localhost:9001` - Console MinIO (minioadmin/minioadmin)

## Identifiants par defaut

- **Admin** : vcheloudiakoff@gmail.com / changeme123

## Structure du projet

```
galerie-cheloudiakoff-labomaton/
├── backend/
│   ├── src/
│   │   ├── auth/          # JWT & middleware
│   │   ├── handlers/      # Route handlers
│   │   ├── models/        # Data models
│   │   └── routes/        # API routes
│   ├── migrations/        # SQL migrations
│   ├── Cargo.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

## API

### Routes publiques

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/public/home` | Donnees page d'accueil |
| GET | `/api/public/artists` | Liste des artistes |
| GET | `/api/public/artists/:slug` | Detail artiste |
| GET | `/api/public/events` | Liste des evenements |
| GET | `/api/public/events/:slug` | Detail evenement |
| GET | `/api/public/posts` | Liste des actualites |
| GET | `/api/public/posts/:slug` | Detail actualite |
| GET | `/api/public/pages/:key` | Page statique |
| POST | `/api/public/contact` | Envoyer un message |
| POST | `/api/public/waitlist` | Inscription waitlist |

### Routes admin (authentifie)

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Utilisateur courant |
| GET/POST | `/api/admin/artists` | CRUD artistes |
| GET/POST | `/api/admin/artworks` | CRUD oeuvres |
| GET/POST | `/api/admin/events` | CRUD evenements |
| GET/POST | `/api/admin/posts` | CRUD actualites |
| GET/POST | `/api/admin/media` | CRUD medias |
| GET | `/api/admin/messages` | Messages contact |
| GET | `/api/admin/waitlist` | Waitlist Labomaton |
| GET | `/api/admin/waitlist/export` | Export CSV waitlist |

## Deploiement

### Backend

1. Build l'image Docker :
```bash
cd backend
docker build -t galerie-backend .
```

2. Deployer sur Fly.io / Scalingo / VPS

3. Variables d'environnement requises :
- `DATABASE_URL`
- `JWT_SECRET`
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_URL`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

### Frontend

1. Build :
```bash
cd frontend
npm run build
```

2. Deployer le dossier `dist/` sur Vercel / Netlify

3. Variable d'environnement :
- `VITE_API_URL` - URL de l'API backend

## Seed Data

Pour charger les donnees de demo :

```bash
# Connectez-vous a PostgreSQL
docker compose exec db psql -U galerie -d galerie

# Executez le fichier de seed
\i /path/to/migrations/002_seed_demo.sql
```

Ou utilisez la migration automatique (le fichier 002 sera execute au demarrage).

## Phase 2 - Labomaton (a venir)

Fonctionnalites prevues :
- Upload photo client
- Configurateur cadre/impression
- Preview temps reel
- Panier et commande
- Paiement Stripe
- Suivi commande

---

**Galerie Cheloudiakoff x Labomaton**
