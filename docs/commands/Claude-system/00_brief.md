# Agent 00: Project Brief

> **Ce face**: Creează fundația proiectului - descrierea produsului și regulile tehnice.
> **Când îl folosești**: La începutul unui proiect nou.
> **Rezultat**: `app_truth.md` și `docs/PRODUCT_BRIEF.md`

---

## Cum Îl Folosești

```bash
@00_brief.md "Descrierea aplicației tale"
```

**Exemplu:**
```bash
@00_brief.md "O aplicație de gestionare a cheltuielilor personale.
Utilizatorii pot adăuga cheltuieli cu categorie, sumă și dată.
Vreau React pentru frontend și FastAPI pentru backend."
```

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Înțelege Cerințele

Din descrierea utilizatorului, extrage:

1. **Scopul** - Ce problemă rezolvă aplicația?
2. **Utilizatorii** - Cine o va folosi?
3. **Funcționalități** - Ce trebuie să facă?
4. **Tehnologii** - Ce stack e specificat sau recomandat?

**Dacă descrierea e neclară**, întreabă maximum 5 întrebări:

```
Înainte să creez proiectul, am câteva întrebări:

1. Aplicația va avea mai mulți utilizatori sau e pentru uz personal?
2. Ai preferințe pentru baza de date (PostgreSQL, MongoDB, SQLite)?
3. Va fi nevoie de autentificare?
4. Ai preferințe pentru stilizare (Tailwind, CSS modules, styled-components)?
5. Unde intenționezi să faci deploy (Vercel, AWS, self-hosted)?
```

### Pas 2: Alege Tehnologiile

Dacă nu sunt specificate, recomandă în funcție de tip:

| Tip Aplicație | Frontend | Backend | Database |
|---------------|----------|---------|----------|
| Web SPA simplu | React + Vite | - | localStorage |
| Web cu date | React + Vite | FastAPI | PostgreSQL |
| Site static | Next.js (static) | - | - |
| API only | - | FastAPI | PostgreSQL |
| Full-stack rapid | Next.js | Next.js API | PostgreSQL |

### Pas 3: Creează Product Brief

Scrie în `docs/PRODUCT_BRIEF.md`:

```markdown
# [Nume Proiect] - Product Brief

## Descriere
[2-3 propoziții despre ce face aplicația]

## Utilizatori Țintă
[Cine folosește și de ce]

## Funcționalități Principale
1. [Funcționalitate 1]
2. [Funcționalitate 2]
3. [Funcționalitate 3]

## Stack Tehnologic

| Componentă | Tehnologie | De ce |
|------------|------------|-------|
| Frontend | [Tech] | [Motiv] |
| Backend | [Tech] | [Motiv] |
| Database | [Tech] | [Motiv] |

## Criterii de Succes
- [Criteriu măsurabil 1]
- [Criteriu măsurabil 2]
```

### Pas 4: Creează App Truth

Scrie în `app_truth.md` (în rădăcina proiectului):

```markdown
# APP TRUTH - [Nume Proiect]

> **Scop**: Sursă unică de adevăr pentru configurare, arhitectură și standarde.
> **Actualizat**: [Data]

---

## 1. Identitate Proiect

- **Nume**: [Numele proiectului]
- **Versiune**: 0.1.0
- **Descriere**: [O propoziție]

---

## 2. Stack Tehnologic

| Componentă | Tehnologie | Versiune |
|------------|------------|----------|
| Frontend | [ex: React] | [ex: 18.x] |
| Backend | [ex: FastAPI] | [ex: 0.100+] |
| Database | [ex: PostgreSQL] | [ex: 15] |
| Cache | [ex: Redis] | [ex: 7] |

---

## 3. Infrastructură și Porturi

| Serviciu | Port | URL |
|----------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 8000 | http://localhost:8000 |
| Database | 5432 | postgresql://localhost:5432/[db] |

---

## 4. Variabile de Mediu

| Variabilă | Obligatorie | Descriere |
|-----------|-------------|-----------|
| DATABASE_URL | Da | Connection string pentru DB |
| SECRET_KEY | Da | Cheie pentru semnare JWT |
| DEBUG | Nu | Mod debug (default: false) |

---

## 5. Structura Proiectului

```
[project-root]/
├── frontend/           # Aplicația frontend
│   ├── src/
│   │   ├── components/ # Componente React
│   │   ├── pages/      # Pagini/Routes
│   │   ├── hooks/      # Custom hooks
│   │   ├── stores/     # State management
│   │   ├── services/   # API calls
│   │   ├── theme/      # Design tokens
│   │   └── utils/      # Funcții utilitare
│   └── package.json
│
├── backend/            # API Backend
│   ├── app/
│   │   ├── api/        # Endpoints
│   │   ├── core/       # Configurare, security
│   │   ├── models/     # Modele database
│   │   ├── schemas/    # Pydantic schemas
│   │   └── services/   # Business logic
│   └── requirements.txt
│
├── docs/
│   ├── commands/       # Sistemul de agenți
│   ├── features/       # Documentație features
│   └── DESIGN_SYSTEM.md
│
├── app_truth.md        # Acest fișier
└── docker-compose.yml
```

---

## 6. Standarde de Cod

### Convenții de Numire
- **Fișiere**: kebab-case (`user-profile.tsx`)
- **Componente**: PascalCase (`UserProfile`)
- **Funcții**: camelCase (`getUserById`)
- **Constante**: UPPER_SNAKE (`MAX_RETRIES`)
- **Database**: snake_case (`user_id`, `created_at`)

### Stil Cod
- Frontend: ESLint + Prettier
- Backend: Ruff sau Black
- Lățime maximă linie: 100 caractere
- Indentare: 2 spații (frontend), 4 spații (backend)

---

## 7. Convenții API

### Structura Endpoint-urilor
- Format: REST
- Prefix: `/api/v1/`
- Resurse la plural: `/api/v1/users`, `/api/v1/products`

### Format Răspuns
```json
{
  "data": { ... },      // Datele cerute
  "error": null,        // sau mesaj de eroare
  "meta": {             // opțional
    "total": 100,
    "page": 1
  }
}
```

### Coduri HTTP
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## 8. Convenții Database

### Tabele
- Nume: plural, snake_case (`users`, `order_items`)
- Primary key: `id` (UUID sau auto-increment)
- Timestamps: `created_at`, `updated_at`
- Soft delete: `deleted_at` (opțional)

### Relații
- Foreign keys: `[table]_id` (`user_id`, `order_id`)
- Many-to-many: tabel de legătură (`user_roles`)

### Migrații
- Tool: Alembic (Python) sau Prisma (Node)
- Naming: `YYYY_MM_DD_descriere`

---

## 9. UI/UX și Sistem de Design

### Locații Fișiere Design
| Scop | Fișier |
|------|--------|
| Definiții tokens | `src/theme/tokens.ts` |
| CSS generat | `src/theme/generated/design-tokens.css` |
| Tailwind config | `tailwind.config.js` |
| Documentație | `docs/DESIGN_SYSTEM.md` |

### Reguli Stricte
1. **FĂRĂ culori hardcodate** - folosește design tokens
2. **FĂRĂ spacing hardcodat** - folosește scala de spacing
3. **SUPORT dark mode** - toate componentele
4. **MOBILE-FIRST** - design pentru mobil, extinde pentru desktop

### Paletă Culori
- **Primary**: [culoare și scop]
- **Neutral**: [culoare și scop]
- **Semantic**: success (verde), warning (galben), error (roșu), info (albastru)

---

## 10. Autentificare și Securitate

### Metodă Auth
- [JWT / Session / OAuth - specifică]

### Roluri
- [Listează rolurile: admin, user, etc.]

### Reguli
- Passwords: minim 8 caractere, hashed cu bcrypt
- Tokens: JWT cu expirare [X ore]
- CORS: configurat pentru domeniile permise

---

## 11. Comenzi Operaționale

```bash
# Development
docker compose up           # Pornește toate serviciile
npm run dev                 # Doar frontend
uvicorn app.main:app --reload  # Doar backend

# Build
npm run build              # Build frontend
npm run theme:build        # Regenerează design tokens

# Testing
npm run test               # Teste frontend
pytest                     # Teste backend

# Linting
npm run lint               # Lint frontend
ruff check .               # Lint backend
```

---

## 12. Deployment

### Medii
- **Development**: localhost
- **Staging**: [URL staging]
- **Production**: [URL producție]

### CI/CD
- [GitHub Actions / GitLab CI / etc.]

---

**NOTĂ**: Acest fișier este sursa de adevăr. Toți agenții îl referențiază. Actualizează-l când arhitectura se schimbă.
```

### Pas 5: Creează Structura de Directoare

```
docs/
├── commands/           # Deja există
├── features/           # Pentru documentația features
│   └── .gitkeep
├── PRODUCT_BRIEF.md    # Creat mai sus
└── DESIGN_SYSTEM.md    # Placeholder
```

Pentru proiecte cu frontend:
```
src/theme/
├── tokens.ts           # Va fi populat de 07_theme
├── index.ts            # Exporturi
├── generated/          # Fișiere generate
│   └── .gitkeep
└── scripts/
    └── generate.ts     # Script generator
```

### Pas 6: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                    BRIEF PROIECT COMPLET
═══════════════════════════════════════════════════════════════

Proiect: [Nume]
Stack: [Frontend] + [Backend] + [Database]

Fișiere create:
  ✓ docs/PRODUCT_BRIEF.md
  ✓ app_truth.md
  ✓ docs/features/ (director)
  ✓ src/theme/ (director, dacă e frontend)

Pași următori:
  1. Verifică app_truth.md și ajustează dacă e nevoie
  2. Rulează @07_theme.md pentru a seta designul
  3. Rulează @01_plan.md pentru prima feature

  SAU pentru automatizare completă:
  → @auto_feature.md "prima funcționalitate"

═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Întreabă dacă e neclar** - Maximum 5 întrebări
2. **Nu presupune** - Dacă nu știi, întreabă
3. **Fii complet** - app_truth.md trebuie să acopere totul
4. **Fii consistent** - Folosește aceleași convenții peste tot

---

## Output

| Fișier | Scop |
|--------|------|
| `docs/PRODUCT_BRIEF.md` | Descriere high-level produs |
| `app_truth.md` | SSOT tehnic (referit de toți agenții) |

---

## Următorul Agent

→ `@07_theme.md` - Setează sistemul de design
→ `@01_plan.md` - Planifică prima feature
