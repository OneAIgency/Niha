# Agent 06: Write Documentation

> **Ce face**: Documentează feature-ul astfel încât documentația să reflecte implementarea actuală.
> **Când îl folosești**: După ce code review a trecut fără probleme Critical/Major.
> **Rezultat**: Documentație actualizată în tot proiectul.

---

## Cum Îl Folosești

```bash
@06_docs.md @docs/features/NNNN_PLAN.md @docs/features/NNNN_REVIEW.md
```

---

## Cerințe Prealabile

- Implementarea completă și review-uită
- Code review passed (fără probleme Critical/Major)
- Acces la codul implementat

---

## Principiu Fundamental

**Codul este sursa de adevăr.** Dacă există discrepanțe între plan/review și codul actual, documentează ce face codul.

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Adună Context

1. **Citește planul** - Cerințele originale
2. **Citește review-ul** - Starea finală, orice devieri
3. **Examinează codul** - Ce s-a implementat de fapt
4. **Verifică `app_truth.md`** - Ce secțiuni ar putea necesita update

### Pas 2: Identifică Nevoile de Documentare

Determină ce necesită documentație:

| Tip Modificare | Documentație Necesară |
|----------------|----------------------|
| Endpoint-uri API noi | `app_truth.md` §7, docs API |
| Modificări database | `app_truth.md` §8, docs schema |
| Componente UI noi | `DESIGN_SYSTEM.md`, docs componente |
| Design tokens noi | `app_truth.md` §9, docs tokens |
| Modificări config | `app_truth.md` §4, README |
| Rute noi | `app_truth.md` §5 sau §8 |
| Modificări auth | `app_truth.md` §10 |

### Pas 3: Actualizează app_truth.md

**Actualizează DOAR secțiunile afectate de această feature.**

**§7 Convenții API** - Dacă endpoint-uri noi:
```markdown
### Endpoint-uri [Nume Feature]

| Metodă | Endpoint | Scop |
|--------|----------|------|
| POST | /api/v1/[resource] | Creează [resource] |
| GET | /api/v1/[resource]/:id | Obține [resource] |
| PUT | /api/v1/[resource]/:id | Actualizează [resource] |
| DELETE | /api/v1/[resource]/:id | Șterge [resource] |

**Request/Response:**
[Exemple scurte]
```

**§8 Database/Routing** - Dacă tabele sau rute noi:
```markdown
### [Nume Feature]

**Tabele:**
- `[table_name]` - [descriere scurtă]

**Rute:**
- `/path/to/feature` - [Descriere]
- Acces: [Roluri care au acces]
```

**§9 UI/UX** - Dacă pattern-uri de design noi:
```markdown
### [Componentă/Pattern Nou]

- Locație: `src/components/path/Component.tsx`
- Utilizare: [Când se folosește]
- Tokens: [Ce design tokens folosește]
```

### Pas 4: Actualizează DESIGN_SYSTEM.md

**Doar dacă s-au creat componente UI.**

Adaugă documentație pentru componente noi:

```markdown
## [Nume Componentă]

### Scop
[Ce face componenta]

### Locație
`src/components/path/ComponentName.tsx`

### Utilizare

```tsx
import { ComponentName } from '@/components/path/ComponentName';

<ComponentName
  prop1="value"
  prop2={true}
  onAction={() => handleAction()}
/>
```

### Props

| Prop | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| prop1 | string | Da | [Descriere] |
| prop2 | boolean | Nu | [Descriere] |
| onAction | () => void | Da | [Descriere] |

### Variante
- **Default**: [Descriere]
- **Active**: [Descriere]
- **Disabled**: [Descriere]

### Design Tokens Folosite
- `--color-surface` - Background
- `--color-primary` - Accent color
- `--space-4` - Padding intern

### Exemple

#### Basic Usage
```tsx
<ComponentName prop1="Hello" onAction={() => {}} />
```

#### With All Options
```tsx
<ComponentName
  prop1="Hello"
  prop2={true}
  onAction={() => console.log('clicked')}
/>
```
```

### Pas 5: Adaugă Comentarii în Cod

Adaugă comentarii **DOAR unde scopul nu e evident**:

```typescript
/**
 * Calculează data de settlement bazată pe regula T+3 zile lucrătoare.
 * Exclude weekendurile și sărbătorile configurate.
 *
 * @param tradeDate - Data tranzacției
 * @returns Data settlement (T+3 zile lucrătoare)
 */
function calculateSettlementDate(tradeDate: Date): Date {
  // Logică complexă care beneficiază de explicație
}
```

**NU adăuga comentarii evidente:**
```typescript
// ❌ Nu face asta
// Get user by ID
function getUserById(id: string) { ... }

// ✅ Doar când logica nu e evidentă
// Folosește binary search pentru O(log n) lookup în price levels sortate
function findPriceLevel(price: number): PriceLevel | null { ... }
```

### Pas 6: Actualizează README (dacă e cazul)

Dacă feature-ul e user-facing sau schimbă setup-ul:

```markdown
## [Nume Feature]

[Descriere scurtă]

### Utilizare

[Cum se folosește feature-ul]

### Configurare

| Variabilă | Descriere | Default |
|-----------|-----------|---------|
| VAR_NAME | [Ce face] | [value] |

### Exemple

[Exemple de utilizare]
```

### Pas 7: Păstrează Feature Docs

Fișierele de documentație feature sunt pentru referință istorică:

- `NNNN_PLAN.md` - Păstrează ca atare (istoric)
- `NNNN_UI_SPEC.md` - Păstrează ca atare (istoric)
- `NNNN_REVIEW.md` - Păstrează ca atare (istoric)

**NU crea** fișiere de documentație noi în `docs/features/`. Acel director e doar pentru plan/review history.

### Pas 8: Verifică Documentația

Checklist:
- [ ] `app_truth.md` actualizat (dacă arhitectura a fost afectată)
- [ ] `DESIGN_SYSTEM.md` actualizat (dacă s-au adăugat componente UI)
- [ ] Comentarii cod adăugate (unde logica e complexă)
- [ ] README actualizat (dacă modificări user-facing)
- [ ] Fără link-uri broken în documentație
- [ ] Exemplele sunt accurate și funcționale

### Pas 9: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                   DOCUMENTAȚIE COMPLETĂ
═══════════════════════════════════════════════════════════════

Feature: [Nume Feature]

Documentație actualizată:
  ✓ app_truth.md
      - §7: Adăugat endpoint-uri API pentru [feature]
      - §8: Adăugat documentație rute
  ✓ DESIGN_SYSTEM.md
      - Adăugat documentație [ComponentName]
  ✓ Comentarii cod
      - [file.ts]: Adăugat JSDoc pentru funcții complexe

Fără update necesar:
  - README.md (fără modificări user-facing)

Documentație feature păstrată:
  - docs/features/NNNN_PLAN.md
  - docs/features/NNNN_UI_SPEC.md
  - docs/features/NNNN_REVIEW.md

═══════════════════════════════════════════════════════════════
                    FEATURE COMPLET
═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Codul e adevărul** - Documentează ce e implementat, nu ce era planificat
2. **Nu supra-documenta** - Documentează doar ce nu e evident
3. **Păstrează exemplele funcționale** - Testează că exemplele de cod funcționează
4. **Actualizează, nu duplica** - Modifică docs existente, nu crea versiuni paralele
5. **Feature docs sunt istoric** - Nu adăuga în `docs/features/` în afară de plan/review

---

## Output

Documentație actualizată în tot proiectul.

---

## Următorul Agent

Niciunul - Dezvoltarea feature-ului e completă!

---

## Checklist Final Feature

În acest punct, feature-ul ar trebui să aibă:

- [x] Document plan (`NNNN_PLAN.md`)
- [x] UI spec (`NNNN_UI_SPEC.md`) - dacă e cazul
- [x] Implementare funcțională
- [x] Code review passed (`NNNN_REVIEW.md`)
- [x] Toate problemele rezolvate
- [x] Documentație actualizată
- [x] Gata pentru merge/deploy
