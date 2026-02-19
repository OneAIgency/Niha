# Agent 04: Code Review

> **Ce face**: Verifică temeinic implementarea contra planului și standardelor proiectului.
> **Când îl folosești**: După ce implementarea e completă.
> **Rezultat**: `docs/features/NNNN_REVIEW.md` cu lista de probleme găsite.

---

## Cum Îl Folosești

```bash
@04_review.md @docs/features/NNNN_PLAN.md
```

---

## Cerințe Prealabile

- Implementarea e completă
- Documentul de plan există
- `app_truth.md` disponibil pentru referință

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Adună Context

1. **Citește planul** - `docs/features/NNNN_PLAN.md`
2. **Citește UI spec** - `docs/features/NNNN_UI_SPEC.md` (dacă există)
3. **Verifică `app_truth.md`** - Standarde proiect
4. **Identifică toate fișierele modificate** - Noi și existente

### Pas 2: Checklist de Review

Parcurge fiecare categorie sistematic:

#### 2.1 Conformitate cu Planul

- [ ] Toate cerințele din plan implementate
- [ ] Nu s-au adăugat features extra (scope creep)
- [ ] Arhitectura match-uiește planul
- [ ] Endpoint-urile API match-uiesc specificația din plan
- [ ] Schema database match-uiește planul

#### 2.2 Calitate Cod

- [ ] Respectă convențiile de naming (`app_truth.md` §6)
- [ ] Consistent cu stilul existent în codebase
- [ ] Fără funcții prea complexe (max ~50 linii)
- [ ] Fără cod duplicat
- [ ] Separare corectă a responsabilităților
- [ ] Fișiere nu prea mari (max ~300 linii, split dacă mai mare)

#### 2.3 Type Safety

- [ ] Toate tipurile definite corect
- [ ] Fără tipuri `any` (decât dacă absolut necesar)
- [ ] Tipurile request/response match-uiesc între frontend și backend
- [ ] Fără probleme de type coercion

#### 2.4 Error Handling

- [ ] Toate API calls au try/catch
- [ ] Mesaje de eroare user-friendly
- [ ] Erorile sunt logged corespunzător
- [ ] Fără silent failures
- [ ] Edge cases tratate

#### 2.5 Aliniere Date

Probleme comune de verificat:
- [ ] Consistență snake_case vs camelCase
- [ ] Formate de date consistente
- [ ] Precizie numere (decimale)
- [ ] Handling null vs undefined
- [ ] Acces nested object (`data.field` vs `data?.field`)

#### 2.6 Securitate

- [ ] Input validation pe toate endpoint-urile
- [ ] Fără vulnerabilități SQL injection
- [ ] Fără vulnerabilități XSS
- [ ] Authentication/authorization corect
- [ ] Date sensibile nu sunt logged
- [ ] Fără secrets în cod

#### 2.7 Performanță

- [ ] Fără probleme N+1 queries
- [ ] Indexuri database adecvate
- [ ] Fără re-renders inutile (React)
- [ ] Liste mari virtualizate
- [ ] Imagini optimizate

#### 2.8 UI/UX (dacă are UI)

Fișiere de referință:
- `app_truth.md` §9
- `docs/DESIGN_SYSTEM.md`
- `src/theme/tokens.ts`

Verifică:
- [ ] Folosește design tokens (fără culori/spacing hardcodate)
- [ ] Suportă light și dark mode
- [ ] Responsive pe mobile/tablet/desktop
- [ ] Loading states implementate
- [ ] Error states implementate
- [ ] Empty states implementate
- [ ] Accesibilitate (ARIA labels, keyboard navigation)
- [ ] Urmează pattern-urile de componente existente

#### 2.9 Testing

- [ ] Unit tests pentru business logic
- [ ] Integration tests pentru API endpoints
- [ ] Component tests pentru UI (dacă e cazul)
- [ ] Edge cases testate

### Pas 3: Categorizează Problemele

Pentru fiecare problemă găsită, categorizează:

**Critical** (Trebuie rezolvat, blochează release)
- Vulnerabilități de securitate
- Potențial de pierdere date
- Feature complet broken
- Probleme majore de performanță

**Major** (Trebuie rezolvat, impact semnificativ)
- Funcționalitate parțial broken
- Lipsă error handling
- Violări accesibilitate
- Violări design system

**Minor** (Ar trebui rezolvat, polish)
- Inconsistențe stil cod
- Lipsă handling edge case
- Inconsistențe UI minore
- Gaps documentație

**Recomandări** (Nice to have)
- Optimizări performanță
- Îmbunătățiri organizare cod
- Sugestii pentru viitor

### Pas 4: Scrie Documentul de Review

Scrie în `docs/features/NNNN_REVIEW.md`:

```markdown
# Code Review: [Nume Feature]

> **Plan**: NNNN_PLAN.md
> **Revizuit**: [Data]
> **Status**: [PASS / NECESITĂ MODIFICĂRI]

---

## Sumar

[2-3 propoziții sumarizând calitatea implementării]

**Verdict**: [PASS / NECESITĂ MODIFICĂRI]

---

## Statistici

| Categorie | Număr |
|-----------|-------|
| Fișiere revizuite | N |
| Probleme Critical | X |
| Probleme Major | Y |
| Probleme Minor | Z |
| Recomandări | W |

---

## Conformitate Plan

- [x] Cerință 1: Implementată corect
- [x] Cerință 2: Implementată corect
- [ ] Cerință 3: **LIPSĂ** (vezi Critical #1)

---

## Probleme

### Probleme Critical

#### C1: [Titlu Problemă]

**Fișier**: `path/to/file.ts`
**Linia**: 42-45

**Problema**:
[Descriere problemă]

**Cod curent**:
```typescript
// Codul problematic
```

**Cod așteptat**:
```typescript
// Cum ar trebui să fie
```

**Impact**: [De ce e critical]

---

### Probleme Major

#### M1: [Titlu Problemă]

**Fișier**: `path/to/file.ts`
**Linia**: 78

**Problema**: [Descriere]

**Fix**: [Ce trebuie făcut]

---

### Probleme Minor

#### m1: [Titlu Problemă]

**Fișier**: `path/to/file.ts`
**Linia**: 102

**Problema**: [Descriere scurtă]
**Fix**: [Fix scurt]

---

### Recomandări

#### R1: [Titlu Recomandare]

[Descriere și rațiune]

---

## Review UI/UX

[Dacă feature-ul are componente UI]

### Conformitate Design Tokens

| Verificare | Status | Note |
|------------|--------|------|
| Fără culori hardcodate | ✓ / ✗ | [Note] |
| Fără spacing hardcodat | ✓ / ✗ | [Note] |
| Suport dark mode | ✓ / ✗ | [Note] |
| Design responsive | ✓ / ✗ | [Note] |

### Stări Componente

| Component | Loading | Error | Empty | Note |
|-----------|---------|-------|-------|------|
| ComponentA | ✓ | ✓ | ✓ | OK |
| ComponentB | ✓ | ✗ | ✓ | Lipsă error state |

### Accesibilitate

| Verificare | Status |
|------------|--------|
| ARIA labels | ✓ / ✗ |
| Keyboard navigation | ✓ / ✗ |
| Focus management | ✓ / ✗ |
| Color contrast | ✓ / ✗ |

---

## Fișiere Revizuite

| Fișier | Status | Probleme |
|--------|--------|----------|
| `path/to/file1.ts` | ✓ Clean | - |
| `path/to/file2.tsx` | ⚠️ Issues | M1, m2 |
| `path/to/file3.py` | ✗ Critical | C1 |

---

## Pași Următori

[Dacă NECESITĂ MODIFICĂRI:]
1. Rezolvă toate problemele Critical
2. Rezolvă toate problemele Major
3. Rezolvă problemele Minor
4. Rulează `@05_fix.md` pentru a adresa toate problemele
5. Re-rulează `@04_review.md` pentru a verifica

[Dacă PASS:]
1. Continuă cu `@06_docs.md` pentru documentație
```

### Pas 5: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                     CODE REVIEW COMPLET
═══════════════════════════════════════════════════════════════

Feature: [Nume Feature]
Review: docs/features/NNNN_REVIEW.md

Rezultate:
  Critical: X probleme
  Major:    Y probleme
  Minor:    Z probleme
  Recomandări: W

Verdict: [PASS / NECESITĂ MODIFICĂRI]

[Dacă NECESITĂ MODIFICĂRI:]
Următorul pas:
  → @05_fix.md @docs/features/NNNN_REVIEW.md

[Dacă PASS:]
Următorul pas:
  → @06_docs.md @docs/features/NNNN_PLAN.md

═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Fii temeinic** - Verifică fiecare fișier modificat
2. **Fii specific** - Include căi de fișiere și numere de linie
3. **Fii obiectiv** - Focus pe fapte, nu preferințe
4. **Prioritizează corect** - Critical > Major > Minor
5. **Oferă soluții** - Nu doar identifica probleme

---

## Output

| Fișier | Scop |
|--------|------|
| `docs/features/NNNN_REVIEW.md` | Code review detaliat |

---

## Următorul Agent

→ `@05_fix.md` - Dacă s-au găsit probleme
→ `@06_docs.md` - Dacă review-ul a trecut
