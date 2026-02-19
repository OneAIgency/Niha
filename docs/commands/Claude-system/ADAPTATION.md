# Ghid de Adaptare - Personalizează Pentru Fiecare Proiect

> Acest ghid explică cum să adaptezi sistemul pentru diferite tipuri de proiecte.

---

## De Ce Trebuie Să Adaptezi?

Fiecare proiect e diferit:
- **Tehnologii diferite** - React vs Vue vs Angular
- **Structuri diferite** - Monolith vs Microservices
- **Echipe diferite** - Solo vs Team
- **Cerințe diferite** - Startup rapid vs Enterprise robust

Sistemul trebuie să știe aceste lucruri pentru a genera cod potrivit.

---

## Când Adaptezi?

```
┌─────────────────────────────────────────────────────────────┐
│                    MOMENTUL ADAPTĂRII                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. La începutul proiectului (OBLIGATORIU)                 │
│      → Când rulezi @auto_project.md sau @00_brief.md        │
│                                                              │
│   2. Când schimbi tehnologii (OPȚIONAL)                     │
│      → Migrezi de la REST la GraphQL                        │
│      → Adaugi o bibliotecă majoră                           │
│                                                              │
│   3. Când schimbi structura echipei (OPȚIONAL)              │
│      → Din solo devii echipă                                │
│      → Adaugi contribuitori externi                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Ce Adaptezi?

### 1. Fișierul `app_truth.md` (Principal)

Acesta e "creierul" proiectului. După ce rulezi `@00_brief.md`, verifică și ajustează:

```markdown
# APP TRUTH - Numele Proiectului

## 2. Technology Stack
│ Component │ Technology │ Version │
├───────────┼────────────┼─────────┤
│ Frontend  │ React      │ 18.x    │  ← Schimbă aici
│ Backend   │ FastAPI    │ 0.100+  │  ← Schimbă aici
│ Database  │ PostgreSQL │ 15      │  ← Schimbă aici

## 6. Coding Standards
- Files: kebab-case           ← Schimbă dacă preferi altfel
- Components: PascalCase      ← Schimbă dacă preferi altfel
- Functions: camelCase        ← Schimbă dacă preferi altfel
```

### 2. Fișierul `docs/DESIGN_SYSTEM.md` (Pentru UI)

Definește culorile și stilul vizual al aplicației:

```markdown
## Color Palette

Primary: #10b981 (verde)     ← Culoarea ta principală
Secondary: #3b82f6 (albastru) ← Culoarea secundară
Accent: #f59e0b (portocaliu)  ← Pentru accentuare
```

### 3. Fișierul `.env.example` (Pentru Configurare)

Documentează variabilele de mediu necesare:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# External Services
STRIPE_API_KEY=sk_test_...
SENDGRID_API_KEY=SG...
```

---

## Ghid de Adaptare pe Tip de Proiect

### A. Aplicație Web Full-Stack

**Descriere:** Frontend + Backend + Database

**Adaptări recomandate în `app_truth.md`:**

```markdown
## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React + TypeScript | 18.x |
| Styling | Tailwind CSS | 3.x |
| State | React Query + Zustand | - |
| Backend | FastAPI | 0.100+ |
| Database | PostgreSQL | 15 |
| ORM | SQLAlchemy | 2.x |
| Cache | Redis | 7 |

## 3. Infrastructure & Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 8000 | http://localhost:8000 |
| Database | 5432 | localhost |
| Redis | 6379 | localhost |

## 7. API Conventions

- Prefix: `/api/v1/`
- Format: REST
- Response: `{ data: T, error?: string, meta?: object }`
- Auth: JWT în header `Authorization: Bearer <token>`
```

---

### B. Site Static / Landing Page

**Descriere:** Doar frontend, fără backend

**Adaptări recomandate în `app_truth.md`:**

```markdown
## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js (Static Export) | 14.x |
| Styling | Tailwind CSS | 3.x |
| Animations | Framer Motion | 10.x |
| Forms | React Hook Form | 7.x |
| Deployment | Vercel / Netlify | - |

## 3. Infrastructure & Ports

| Service | Port | URL |
|---------|------|-----|
| Dev Server | 3000 | http://localhost:3000 |

## 7. API Conventions

Nu avem backend propriu. Pentru formulare folosim:
- Formular contact: Formspree / Netlify Forms
- Newsletter: Mailchimp API (client-side)

## 8. Database Conventions

Nu avem database. Datele sunt:
- Hardcoded în cod (pentru conținut static)
- În fișiere JSON/MDX (pentru conținut editabil)
```

---

### C. API Backend Only

**Descriere:** Doar backend, fără frontend propriu

**Adaptări recomandate în `app_truth.md`:**

```markdown
## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Python | 3.11+ |
| Framework | FastAPI | 0.100+ |
| Database | PostgreSQL | 15 |
| ORM | SQLAlchemy | 2.x |
| Migrations | Alembic | 1.x |
| Validation | Pydantic | 2.x |
| Testing | pytest | 7.x |

## 3. Infrastructure & Ports

| Service | Port | URL |
|---------|------|-----|
| API | 8000 | http://localhost:8000 |
| Docs | 8000 | http://localhost:8000/docs |
| Database | 5432 | localhost |

## 9. UI/UX & Design System

Nu avem UI propriu. API-ul va fi consumat de:
- Aplicație mobilă
- Aplicație web externă
- Alte servicii

Documentație API: Swagger/OpenAPI generată automat.
```

---

### D. Aplicație Mobilă (React Native)

**Descriere:** Aplicație pentru iOS și Android

**Adaptări recomandate în `app_truth.md`:**

```markdown
## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native | 0.72+ |
| Navigation | React Navigation | 6.x |
| State | Zustand + React Query | - |
| Styling | NativeWind | 2.x |
| Forms | React Hook Form | 7.x |
| Backend | [API extern sau Firebase] | - |

## 3. Infrastructure & Ports

| Service | Port | Notes |
|---------|------|-------|
| Metro Bundler | 8081 | Dev server |
| iOS Simulator | - | Xcode required |
| Android Emulator | - | Android Studio required |

## 6. Coding Standards

### Naming Conventions
- Files: PascalCase pentru componente, camelCase pentru utilități
- Screens: `HomeScreen.tsx`, `ProfileScreen.tsx`
- Components: `Button.tsx`, `Card.tsx`

### Folder Structure
```
src/
├── screens/        # Ecranele aplicației
├── components/     # Componente reutilizabile
├── navigation/     # Configurare navigare
├── hooks/          # Custom hooks
├── services/       # API calls
├── stores/         # State management
└── utils/          # Funcții utilitare
```
```

---

### E. Microservicii

**Descriere:** Arhitectură distribuită cu mai multe servicii

**Adaptări recomandate în `app_truth.md`:**

```markdown
## 2. Technology Stack

| Service | Technology | Purpose |
|---------|------------|---------|
| Gateway | Kong / Nginx | API Gateway |
| Auth | FastAPI | Authentication service |
| Users | FastAPI | User management |
| Orders | Go | Order processing |
| Notifications | Node.js | Email/Push notifications |
| Frontend | React | Web application |

## 3. Infrastructure & Ports

| Service | Port | Internal URL |
|---------|------|--------------|
| Gateway | 80 | gateway:80 |
| Auth | 8001 | auth-service:8001 |
| Users | 8002 | users-service:8002 |
| Orders | 8003 | orders-service:8003 |
| Notifications | 8004 | notifications-service:8004 |
| Frontend | 3000 | frontend:3000 |

## 7. API Conventions

### Inter-service Communication
- Sync: REST cu retry logic
- Async: RabbitMQ / Kafka pentru events

### Service Discovery
- Docker Compose pentru development
- Kubernetes pentru production

### Shared Types
- Pachet comun: `@company/types`
- Schemas: Protocol Buffers sau JSON Schema
```

---

## Template de Adaptare Rapidă

Copiază și completează acest checklist la începutul fiecărui proiect:

```markdown
# Checklist Adaptare Proiect

## 1. Informații de Bază
- [ ] Nume proiect: ________________
- [ ] Tip: [ ] Web Full-Stack [ ] Static [ ] API [ ] Mobile [ ] Microservicii
- [ ] Solo sau Echipă: ________________

## 2. Tehnologii
- [ ] Frontend: ________________ (versiune: ___)
- [ ] Backend: ________________ (versiune: ___)
- [ ] Database: ________________ (versiune: ___)
- [ ] Alte servicii: ________________

## 3. Design
- [ ] Culoare principală: #______
- [ ] Culoare secundară: #______
- [ ] Font: ________________
- [ ] Dark mode: [ ] Da [ ] Nu

## 4. Convenții
- [ ] Nume fișiere: [ ] kebab-case [ ] camelCase [ ] PascalCase
- [ ] Indentare: [ ] 2 spații [ ] 4 spații [ ] tabs
- [ ] Quotes: [ ] single ' [ ] double "

## 5. Deployment
- [ ] Hosting frontend: ________________
- [ ] Hosting backend: ________________
- [ ] CI/CD: ________________

## 6. Servicii Externe
- [ ] Auth: [ ] Custom [ ] Auth0 [ ] Firebase [ ] Clerk
- [ ] Payments: [ ] Stripe [ ] Paddle [ ] None
- [ ] Email: [ ] SendGrid [ ] Resend [ ] None
- [ ] Analytics: [ ] Vercel [ ] Plausible [ ] GA [ ] None
```

---

## Exemple de Descrieri Bine Scrise

### Exemplu 1: Aplicație SaaS

```
@auto_project.md "O platformă SaaS de management al proiectelor.

UTILIZATORI:
- Echipe mici și medii (5-50 persoane)
- Project managers și dezvoltatori

FUNCȚIONALITĂȚI PRINCIPALE:
- Creare proiecte cu taskuri și subtaskuri
- Kanban board cu drag-and-drop
- Timeline / Gantt chart
- Comentarii și atașamente pe taskuri
- Notificări în timp real
- Rapoarte și statistici

TEHNOLOGII:
- Frontend: React 18 + TypeScript + Tailwind
- Backend: Python FastAPI
- Database: PostgreSQL
- Real-time: WebSockets
- Auth: JWT cu refresh tokens

DESIGN:
- Modern, clean, minimalist
- Culoare principală: albastru (#3b82f6)
- Suport pentru dark mode
- Responsive pentru mobile

INTEGRĂRI VIITOARE:
- Slack, GitHub, GitLab (menționez pentru a structura corect)"
```

### Exemplu 2: E-commerce

```
@auto_project.md "Un magazin online pentru vânzare de cărți.

UTILIZATORI:
- Clienți: cumpără cărți
- Admin: gestionează produse și comenzi

FUNCȚIONALITĂȚI CLIENȚI:
- Catalog cărți cu filtre (categorie, preț, rating)
- Căutare full-text
- Coș de cumpărături persistent
- Checkout cu Stripe
- Cont utilizator cu istoric comenzi
- Wishlist
- Reviews pe produse

FUNCȚIONALITĂȚI ADMIN:
- CRUD produse
- Gestionare comenzi
- Dashboard cu vânzări

TEHNOLOGII:
- Frontend: Next.js 14 (App Router)
- Backend: Next.js API Routes
- Database: PostgreSQL + Prisma
- Payments: Stripe
- Search: Algolia sau Meilisearch
- Images: Cloudinary

DESIGN:
- Cald, prietenos, accent pe imagini
- Culori: cream (#fef3c7) + maro (#78350f)
- Font: serif pentru titluri, sans pentru body"
```

---

## După Ce Adaptezi

1. **Verifică `app_truth.md`** - E complet și corect?
2. **Rulează prima feature** - `@auto_feature.md "funcționalitatea de bază"`
3. **Verifică codul generat** - Respectă convențiile tale?
4. **Ajustează dacă e nevoie** - Cere AI-ului să corecteze

---

## Sfaturi Finale

1. **Investește timp în descriere** - Cu cât e mai clară, cu atât codul e mai bun
2. **Nu sări adaptarea** - 10 minute acum salvează ore mai târziu
3. **Actualizează când schimbi** - Dacă adaugi o tehnologie, actualizează `app_truth.md`
4. **Fii consistent** - Odată ales un stil, ține-te de el

---

> **Gata să începi?** Folosește template-ul de mai sus și rulează `@auto_project.md` cu descrierea ta detaliată.
