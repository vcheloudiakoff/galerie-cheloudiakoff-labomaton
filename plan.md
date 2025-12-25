Plan: Galerie Cheloudiakoff + Labomaton

 Objectifs

 Site vitrine pour la Galerie Cheloudiakoff avec:
 - Site public SEO-friendly et responsive
 - Interface admin privee (CRUD complet)
 - Liens de vente externes vers Artsper
 - Section Labomaton "bientot" avec waitlist

 ---
 Phases

 Phase 1 (MVP) - Implementation complete

 - Site public complet
 - Admin CMS fonctionnel
 - Integration Artsper (liens externes)
 - Page Labomaton avec waitlist

 Phase 2 (Future) - Spec uniquement

 - Configurateur impression/cadre Labomaton
 - Upload photos client
 - Commandes et paiement

 ---
 Architecture Technique

 Backend (Rust)

 backend/
 ├── Cargo.toml
 ├── src/
 │   ├── main.rs
 │   ├── config.rs
 │   ├── db.rs
 │   ├── auth/
 │   │   ├── mod.rs
 │   │   ├── jwt.rs
 │   │   └── middleware.rs
 │   ├── handlers/
 │   │   ├── mod.rs
 │   │   ├── public.rs
 │   │   ├── admin.rs
 │   │   └── auth.rs
 │   ├── models/
 │   │   ├── mod.rs
 │   │   ├── user.rs
 │   │   ├── artist.rs
 │   │   ├── artwork.rs
 │   │   ├── event.rs
 │   │   ├── post.rs
 │   │   ├── media.rs
 │   │   └── contact.rs
 │   ├── routes/
 │   │   ├── mod.rs
 │   │   ├── public.rs
 │   │   └── admin.rs
 │   └── error.rs
 ├── migrations/
 │   └── 001_initial.sql
 └── .env.example

 Frontend (React)

 frontend/
 ├── package.json
 ├── vite.config.ts
 ├── tailwind.config.js
 ├── tsconfig.json
 ├── index.html
 ├── src/
 │   ├── main.tsx
 │   ├── App.tsx
 │   ├── api/
 │   │   └── client.ts
 │   ├── components/
 │   │   ├── ui/           # shadcn/ui
 │   │   ├── layout/
 │   │   │   ├── PublicLayout.tsx
 │   │   │   ├── AdminLayout.tsx
 │   │   │   ├── Header.tsx
 │   │   │   └── Footer.tsx
 │   │   └── shared/
 │   ├── pages/
 │   │   ├── public/
 │   │   │   ├── Home.tsx
 │   │   │   ├── Gallery.tsx
 │   │   │   ├── Artists.tsx
 │   │   │   ├── ArtistDetail.tsx
 │   │   │   ├── Events.tsx
 │   │   │   ├── EventDetail.tsx
 │   │   │   ├── News.tsx
 │   │   │   ├── Contact.tsx
 │   │   │   └── Labomaton.tsx
 │   │   └── admin/
 │   │       ├── Login.tsx
 │   │       ├── Dashboard.tsx
 │   │       ├── Artists.tsx
 │   │       ├── Artworks.tsx
 │   │       ├── Events.tsx
 │   │       ├── Posts.tsx
 │   │       ├── Media.tsx
 │   │       └── Waitlist.tsx
 │   ├── hooks/
 │   ├── lib/
 │   └── types/
 └── .env.example

 ---
 Sitemap Public

 | Route             | Page       | Description                                              |
 |-------------------|------------|----------------------------------------------------------|
 | /                 | Home       | Hero, presentation, expo en cours, events, CTA Labomaton |
 | /galerie          | Galerie    | Presentation de la galerie                               |
 | /artistes         | Artistes   | Liste des artistes                                       |
 | /artistes/:slug   | Artiste    | Page artiste + oeuvres                                   |
 | /evenements       | Evenements | Liste des evenements                                     |
 | /evenements/:slug | Evenement  | Detail evenement                                         |
 | /actualites       | Actualites | Liste des posts                                          |
 | /actualites/:slug | Actualite  | Detail post                                              |
 | /contact          | Contact    | Formulaire de contact                                    |
 | /labomaton        | Labomaton  | Bientot + waitlist                                       |

 Routes Admin

 | Route             | Page                    |
 |-------------------|-------------------------|
 | /admin/login      | Connexion               |
 | /admin            | Dashboard               |
 | /admin/artistes   | CRUD Artistes           |
 | /admin/oeuvres    | CRUD Oeuvres            |
 | /admin/evenements | CRUD Evenements         |
 | /admin/actualites | CRUD Posts              |
 | /admin/medias     | CRUD Medias             |
 | /admin/pages      | Edition pages statiques |
 | /admin/messages   | Messages contact        |
 | /admin/waitlist   | Waitlist Labomaton      |

 ---
 Modele de Donnees SQL

 -- Users & Auth
 CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL DEFAULT 'editor', -- admin | editor
     created_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Media
 CREATE TABLE media (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     filename VARCHAR(255) NOT NULL,
     url VARCHAR(500) NOT NULL,
     alt VARCHAR(255),
     credit VARCHAR(255),
     width INT,
     height INT,
     created_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Artists
 CREATE TABLE artists (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name VARCHAR(255) NOT NULL,
     slug VARCHAR(255) UNIQUE NOT NULL,
     bio_md TEXT,
     portrait_media_id UUID REFERENCES media(id),
     artsper_url VARCHAR(500),
     website_url VARCHAR(500),
     instagram_url VARCHAR(500),
     published BOOLEAN DEFAULT FALSE,
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Artworks
 CREATE TABLE artworks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
     title VARCHAR(255) NOT NULL,
     slug VARCHAR(255) NOT NULL,
     year INT,
     medium VARCHAR(255),
     dimensions VARCHAR(255),
     price_note VARCHAR(255),
     artsper_url VARCHAR(500),
     published BOOLEAN DEFAULT FALSE,
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(artist_id, slug)
 );

 -- Artwork Media (many-to-many)
 CREATE TABLE artwork_media (
     artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
     media_id UUID REFERENCES media(id) ON DELETE CASCADE,
     sort_order INT DEFAULT 0,
     PRIMARY KEY (artwork_id, media_id)
 );

 -- Events
 CREATE TABLE events (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title VARCHAR(255) NOT NULL,
     slug VARCHAR(255) UNIQUE NOT NULL,
     start_at TIMESTAMPTZ NOT NULL,
     end_at TIMESTAMPTZ,
     location VARCHAR(255),
     description_md TEXT,
     hero_media_id UUID REFERENCES media(id),
     published BOOLEAN DEFAULT FALSE,
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Event Artists (many-to-many)
 CREATE TABLE event_artists (
     event_id UUID REFERENCES events(id) ON DELETE CASCADE,
     artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
     PRIMARY KEY (event_id, artist_id)
 );

 -- Posts (actualites)
 CREATE TABLE posts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title VARCHAR(255) NOT NULL,
     slug VARCHAR(255) UNIQUE NOT NULL,
     body_md TEXT,
     hero_media_id UUID REFERENCES media(id),
     published BOOLEAN DEFAULT FALSE,
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Static Pages
 CREATE TABLE pages (
     key VARCHAR(100) PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     body_md TEXT,
     hero_media_id UUID REFERENCES media(id),
     updated_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Contact Messages
 CREATE TABLE contact_messages (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL,
     message TEXT NOT NULL,
     status VARCHAR(50) DEFAULT 'new', -- new | read | archived
     created_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Labomaton Waitlist
 CREATE TABLE labomaton_waitlist (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     source VARCHAR(100),
     created_at TIMESTAMPTZ DEFAULT NOW()
 );

 -- Indexes
 CREATE INDEX idx_artists_slug ON artists(slug);
 CREATE INDEX idx_artists_published ON artists(published);
 CREATE INDEX idx_artworks_slug ON artworks(slug);
 CREATE INDEX idx_artworks_artist ON artworks(artist_id);
 CREATE INDEX idx_events_slug ON events(slug);
 CREATE INDEX idx_events_dates ON events(start_at, end_at);
 CREATE INDEX idx_posts_slug ON posts(slug);
 CREATE INDEX idx_posts_published ON posts(published);

 ---
 API Routes Backend

 Auth

 - POST /api/auth/login - Login (email/password) -> JWT
 - POST /api/auth/logout - Logout
 - GET /api/auth/me - Current user

 Public API

 - GET /api/public/home - Home page data
 - GET /api/public/artists - Liste artistes publies
 - GET /api/public/artists/:slug - Detail artiste + oeuvres
 - GET /api/public/events - Liste evenements
 - GET /api/public/events/:slug - Detail evenement
 - GET /api/public/posts - Liste actualites
 - GET /api/public/posts/:slug - Detail actualite
 - GET /api/public/pages/:key - Page statique
 - POST /api/public/contact - Envoyer message
 - POST /api/public/waitlist - Inscription waitlist Labomaton

 Admin API (protected)

 - GET/POST /api/admin/artists - CRUD artistes
 - GET/PUT/DELETE /api/admin/artists/:id
 - POST /api/admin/artists/:id/publish
 - GET/POST /api/admin/artworks
 - GET/PUT/DELETE /api/admin/artworks/:id
 - GET/POST /api/admin/events
 - GET/PUT/DELETE /api/admin/events/:id
 - GET/POST /api/admin/posts
 - GET/PUT/DELETE /api/admin/posts/:id
 - GET/POST /api/admin/media
 - DELETE /api/admin/media/:id
 - GET/PUT /api/admin/pages/:key
 - GET /api/admin/messages
 - PUT /api/admin/messages/:id/status
 - GET /api/admin/waitlist
 - GET /api/admin/waitlist/export - Export CSV

 ---
 Backlog Implementation

 Jour 1 - Foundation

 1. Setup projet backend Rust/Axum
 2. Setup projet frontend React/Vite
 3. Migration SQL initiale
 4. Auth JWT (login/logout/middleware)
 5. CRUD Media (upload images)
 6. CRUD Artistes (base)

 Jour 2 - Core Features

 7. CRUD Oeuvres
 8. CRUD Evenements
 9. CRUD Posts/Actualites
 10. Pages statiques
 11. Contact form
 12. Waitlist Labomaton

 Jour 3 - Frontend Public

 13. Layout public (Header/Footer)
 14. Home page
 15. Page Galerie
 16. Pages Artistes
 17. Pages Evenements
 18. Pages Actualites
 19. Page Contact
 20. Page Labomaton

 Jour 4 - Admin + Polish

 21. Layout admin
 22. Dashboard admin
 23. Formulaires admin complets
 24. SEO (meta, OG, sitemap.xml, robots.txt)
 25. Tests et corrections
 26. Documentation deploy

 ---
 Auth & RBAC

 Roles

 - admin: acces complet, gestion users
 - editor: CRUD contenu, pas de gestion users

 JWT

 - Access token: 24h
 - Stockage: localStorage (SPA)
 - Header: Authorization: Bearer <token>

 Middleware Backend

 // Verifie JWT + role minimum
 pub async fn require_auth(role: &str) -> impl Filter

 Guard Frontend

 // Redirige vers /admin/login si non authentifie
 <ProtectedRoute requiredRole="editor">
   <AdminLayout />
 </ProtectedRoute>

 ---
 SEO

 Meta Tags (par page)

 - title
 - description
 - canonical URL

 OpenGraph

 - og:title
 - og:description
 - og:image
 - og:url
 - og:type

 Fichiers

 - /sitemap.xml - genere dynamiquement
 - /robots.txt - statique

 JSON-LD (basique)

 - Organization (galerie)
 - LocalBusiness
 - Event (pour evenements)

 ---
 Decisions UX

 Navigation

 - Header: Logo, Galerie, Artistes, Evenements, Actualites, Contact
 - Footer: Galerie Cheloudiakoff x Labomaton, liens, legal

 Empty States

 - "Aucun artiste pour le moment"
 - "Aucun evenement a venir"
 - Skeletons pendant chargement

 Artsper

 - Bouton "Voir sur Artsper" (target=_blank, rel=noopener)
 - Icone externe pour indiquer lien sortant

 Admin

 - Listes avec recherche texte simple
 - Actions: Publier/Depublier en un clic
 - Confirmation avant suppression

 ---
 Decisions Utilisateur

 - Design: Design sobre et elegant propose avec shadcn/ui (style galerie d'art)
 - Storage dev: MinIO (S3-compatible) via Docker
 - Seed data: Donnees de demo (artistes/oeuvres/evenements fictifs)
 - Admin email: vcheloudiakoff@gmail.com

 ---
 Deploiement

 Backend

 - Docker container
 - Fly.io ou Scalingo
 - Variables env: DATABASE_URL, JWT_SECRET, S3_*

 Frontend

 - Vercel ou Netlify
 - Build: npm run build
 - Variable env: VITE_API_URL

 Database

 - PostgreSQL managed (Supabase, Neon, ou container)

 Checklist

 1. Build backend Docker
 2. Deploy PostgreSQL
 3. Run migrations
 4. Deploy backend
 5. Build frontend
 6. Deploy frontend
 7. Configurer domaine
 8. Seed admin user

 ---
 Phase 2 (Spec Labomaton)

 Fonctionnalites futures

 - Upload photo client
 - Configurateur cadre/impression
 - Preview temps reel
 - Panier et commande
 - Paiement (Stripe)
 - Suivi commande
 - Dashboard client

 Non implemente Phase 1

 - Aucune logique metier Labomaton
 - Juste page presentation + waitlist

 ---
 Fichiers a Creer

 Backend

 - backend/Cargo.toml
 - backend/src/main.rs
 - backend/src/config.rs
 - backend/src/db.rs
 - backend/src/error.rs
 - backend/src/auth/mod.rs
 - backend/src/auth/jwt.rs
 - backend/src/auth/middleware.rs
 - backend/src/models/*.rs
 - backend/src/handlers/*.rs
 - backend/src/routes/*.rs
 - backend/migrations/001_initial.sql
 - backend/.env.example
 - backend/Dockerfile

 Frontend

 - frontend/package.json
 - frontend/vite.config.ts
 - frontend/tailwind.config.js
 - frontend/tsconfig.json
 - frontend/index.html
 - frontend/src/main.tsx
 - frontend/src/App.tsx
 - frontend/src/api/client.ts
 - frontend/src/components/**/*.tsx
 - frontend/src/pages/**/*.tsx
 - frontend/src/hooks/*.ts
 - frontend/src/types/*.ts
 - frontend/.env.example

 Root

 - README.md
 - docker-compose.yml (PostgreSQL + MinIO)

 ---
 Docker Compose (dev)

 services:
   db:
     image: postgres:16-alpine
     environment:
       POSTGRES_DB: galerie
       POSTGRES_USER: galerie
       POSTGRES_PASSWORD: galerie
     ports:
       - "5432:5432"
     volumes:
       - postgres_data:/var/lib/postgresql/data

   minio:
     image: minio/minio
     command: server /data --console-address ":9001"
     environment:
       MINIO_ROOT_USER: minioadmin
       MINIO_ROOT_PASSWORD: minioadmin
     ports:
       - "9000:9000"
       - "9001:9001"
     volumes:
       - minio_data:/data

 volumes:
   postgres_data:
   minio_data:

 ---
 Seed Data

 Admin User

 - Email: vcheloudiakoff@gmail.com
 - Password: (genere, affiche au premier run)
 - Role: admin

 Demo Content

 - 3 artistes fictifs avec bio et portrait
 - 6-8 oeuvres reparties entre artistes
 - 2 evenements (1 passe, 1 a venir)
 - 2 actualites
 - Pages: galerie, labomaton